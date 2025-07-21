import axiosIns from "@/axios";
import { toast } from "vue3-toastify";
import "vue3-toastify/dist/index.css";
import { ref } from "vue";

// Global loading state
export const isLoading = ref(false);

// Show loading function
const showLoading = () => {
  isLoading.value = true;
};

// Hide loading function
const hideLoading = () => {
  isLoading.value = false;
};

function showError(e: any) {
  let data = e?.response?.data || e;
  console.log('Error: ', data);
  toast.error(data.message || 'An error occurred', {
    theme: "colored",
    autoClose: 3000,
    hideProgressBar: false,
    position: toast.POSITION.TOP_RIGHT,
    pauseOnHover: true,
  });
}


export const getHTTPGetResponse = async (
    url:string,
    input:object = {},
    success_message:boolean = false
  ) => {
    try {
      showLoading();
      const response = await axiosIns.get(url, input);
      let data = response;
  
      if (success_message) {

        toast.success("Get Data Successfully", {
          theme: "colored",
          autoClose: 3000,
          hideProgressBar: false,
          position: toast.POSITION.TOP_RIGHT,
          pauseOnHover: true,
        });
      }
      return data || true;
    } catch (e) {
      showError(e);
      return null;
    } finally {
      hideLoading();
    }
  };

export const getHTTPPutResponse = async (
  url: string,
  input: object = {},
  success_message: string | boolean = false
) => {
  try {
    showLoading();
    const response = await axiosIns.put(url, input);
    const data = response.data;

    if (success_message) {
      const message = typeof success_message === 'string' ? success_message : 'Updated successfully!';
      toast.success(message, {
        theme: "colored",
        autoClose: 3000,
        hideProgressBar: false,
        position: toast.POSITION.TOP_RIGHT,
        pauseOnHover: true,
      });
    }
    return data || true;
  } catch (e) {
    showError(e);
    return null;
  }
};

export const getHTTPPatchResponse = async (
  url: string,
  input: object = {},
  success_message: string | boolean = false
) => {
  try {
    showLoading();
    const response = await axiosIns.patch(url, input);
    const data = response.data;

    if (success_message) {
      const message = typeof success_message === 'string' ? success_message : 'Updated successfully!';
      toast.success(message, {
        theme: "colored",
        autoClose: 3000,
        hideProgressBar: false,
        position: toast.POSITION.TOP_RIGHT,
        pauseOnHover: true,
      });
    }
    return data || true;
  } catch (e) {
    showError(e);
    return null;
  }
};

export const getHTTPDeleteResponse = async (
  url: string,
  input: object = {},
  success_message: string | boolean = false
) => {
  try {
    showLoading();
    const response = await axiosIns.delete(url, { data: input });
    const data = response.data;

    if (success_message) {
      const message = typeof success_message === 'string' ? success_message : 'Deleted successfully!';
      toast.success(message, {
        theme: "colored",
        autoClose: 3000,
        hideProgressBar: false,
        position: toast.POSITION.TOP_RIGHT,
        pauseOnHover: true,
      });
    }
    return data || true;
  } catch (e) {
    showError(e);
    return null;
  }
};

export const getHTTPPostResponse = async (
    url:string,
    input:object = {},
    success_message:boolean = false
  ) => {
    try {
      showLoading();
      const response = await axiosIns.post(url, input);
      let data = response;

      if (success_message) {
        toast.success("Blog Added Successfully!", {
          theme: "colored",
          autoClose: 3000,
          hideProgressBar: false,
          position: toast.POSITION.TOP_RIGHT,
          pauseOnHover: true,
        });
    
      }
      return response || true;
    } catch (e) {
      showError(e);
      return null;
    }
  };
