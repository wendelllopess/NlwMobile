import { Alert, View, Modal, StatusBar, ScrollView } from "react-native";
import { router, useLocalSearchParams, Redirect } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { useCameraPermissions, CameraView } from "expo-camera";

import { Button } from "@/components/button";
import { Loading } from "@/components/loading";
import { Cover } from "@/components/market/cover";
import { Details, PropsDetails } from "@/components/market/details";
import { Coupon } from "@/components/market/coupon";

import { api } from "@/services/api";

type DataProps = PropsDetails & {
  cover: string;
};

export default function Market() {
  const [data, setData] = useState<DataProps>();
  const [isLoading, setIsLoading] = useState(true);
  const [coupon, setCoupon] = useState<string| null>(null); // se caso tiver algum texto faz o codigo do cupom aparecer
  const [isVisibleCameraModal, setIsVisibleCameraModal] = useState(false);
  const [couponIsFetching, setCouponIsFetching] = useState(false);

  //o _ serve pra omitir a primeira informacao do hulk pois eu vou usar so a request
  const [_, requestPermission] = useCameraPermissions();
  const params = useLocalSearchParams<{ id: string }>();

  const qrLock = useRef(false);
  console.log(params.id);

  async function fetchMarket() {
    try {
      const { data } = await api.get(`/markets/${params.id}`);
      setData(data);
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Não foi possivel carregar os dados", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    }
  }

  async function handleOpenCamera() {
    try {
      const { granted } = await requestPermission();

      if (!granted) {
        return Alert.alert("Câmera", "Você precisa habilitar o uso da câmera");
      }
      qrLock.current = false;
      setIsVisibleCameraModal(true);
    } catch (error) {
      console.log(error);
      Alert.alert("Câmera", "Não foi possivel ultizar a camera");
    }
  }

  async function getCoupon(id: string) {
    try {
      setCouponIsFetching(true)

      const { data } = await api.patch("/coupons/" + id)
      console.log("nao ta passando por aqui quando ler o cuporm ");
      Alert.alert("Cupom", data.coupon)
      console.log("nao ta passando por aqui ");
      
      setCoupon(data.coupon)
    } catch (error) {
      console.log(error)
      Alert.alert("Erro", "Não foi possivel ultilizar o cupom");
    } finally {
      setCouponIsFetching(false);
    }
  }

  function handleUseCoupon(id: string) {
    setIsVisibleCameraModal(false);

    Alert.alert(
      "Cupom",
      "Não e possivel ultilizar um cupom resgatado. Deseja realmente resgatar o cupom?",
      [
        { style: "cancel", text: "Não" },
        { text: "Sim", onPress: () => getCoupon(id) },
      ]
    );
  }

  useEffect(() => {
    fetchMarket();
  }, [params.id, coupon]);

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return <Redirect href="/home" />;
  }
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" hidden={isVisibleCameraModal}/>
      <ScrollView showsHorizontalScrollIndicator={false}>
      <Cover uri={data.cover} />
      <Details data={data} />
      {coupon && <Coupon code={coupon} />}
      </ScrollView>

      <View style={{ padding: 32 }}>
        <Button onPress={handleOpenCamera}>
          <Button.Title>Ler QR Code</Button.Title>
        </Button>
      </View>

      <Modal style={{ flex: 1 }} visible={isVisibleCameraModal}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={({ data }) => {
            if (data && !qrLock.current) {
              qrLock.current = true;
              setTimeout(() => handleUseCoupon(data), 500);
            }
          }}
        />

        <View style={{ position: "absolute", bottom: 32, left: 32, right: 32 }}>
          <Button
            onPress={() => setIsVisibleCameraModal(false)}
            isLoading={couponIsFetching}
          >
            <Button.Title>Voltar</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  );
}
