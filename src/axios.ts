import axios from "axios";
// import CryptoJS from "crypto-js";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";


const CancelToken = axios.CancelToken;
let cancel;


// TODO: Make it dynamic URL fro .env
const baseURL = `https://drf-blog-system-production.up.railway.app/api/`;


const axiosIns = axios.create({
   baseURL,
   headers: {
       Accept: "application/json",
       "Content-Type": "application/json",
   },
});



// Response interceptor to decrypt incoming data
axiosIns.interceptors.response.use(
   async response => {
       const { config } = response;


       const rawData = response.data;
//TODO: ADD GLOABL TOAST 
    // if (config.showErrorPopup !== false) {
    //  toast(rawData.message, {
    //     theme: "colored",
    //     type: "success",
    //     transition: "slide",
    //     dangerouslyHTMLString: true,
    // });
    // }


       return rawData; // Return the parsed data
   },
   async error => {
       const rawData = error?.response?.data || null;

    //    if (error && error.status && error?.status !== 200) {
        
    //     toast(error.message, {
    //         theme: "colored",
    //         type: "error",
    //         transition: "slide",
    //         dangerouslyHTMLString: true,
    //     });
    //    }


       return rawData; // Reject the promise so the component can also handle it
   }
);


export default axiosIns;
