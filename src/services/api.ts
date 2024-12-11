import axios from "axios";

export const api = axios.create({
    baseURL: "http://192.168.1.13:3333",  //colocar o Ip do computador e quando for rodar de novo verificar se nao mudou o ip 
    timeout: 700,
})