import axios from "axios";
import Cookies from "js-cookie";
const configApi = axios.create({
  baseURL: "http://localhost:8080",
});

configApi.interceptors.request.use(
  async (config) => {
    const token = Cookies.get("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token} `;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

configApi.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get("refreshToken");

      if (!refreshToken) {
        return Promise.reject(err);
      }

      try {
        const res = await axios.post(
          "http://localhost:8080/auth/refresh",
          {},
          {
            headers: {
              "x-token": refreshToken,
            },
          }
        );

        const newAccessToken = res.data?.accessToken;

        if (!newAccessToken) {
          throw new Error("Không nhận được access token mới");
        }

        Cookies.remove("accessToken");
        // Xóa token cũ

        Cookies.set("accessToken", newAccessToken, {
          expires: 1 / 24, // Thời gian hết hạn là 1 giờ
        });

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return configApi(originalRequest);
      } catch (refreshErr: any) {
        localStorage.removeItem("persist:auth");
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");

        const response = (refreshErr as any)?.response;

        if (response?.data?.detail === "JWT expired") {
          alert("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
          document.location.href = "/login";
        } else if (response?.status === 500) {
          alert("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
          document.location.href = "/login";
        }

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export { configApi };
