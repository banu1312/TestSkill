import apiClient from "./apiClient";

export async function getAll(){
    try{
        const {data} = await apiClient.get('sales',{
            headers: {
                "Content-Type":'application/json',
            }}
        )
        return {error:false ,data}
    }catch(e){
        return {error: true, data: e}
    }
}

export async function searchProduct(product){
    try{
        const {data} = await apiClient.get(`sales?product=${product}`,{
            headers:{
                "Content-Type" : 'application/json'
            }
        })
        return { error:false, data}
    }
    catch(e){
        return {error:true, data:e }
    }
}