import axios from "axios";
import Cookies from "js-cookie";
const configApi = axios.create({
  baseURL: "http://localhost:3000",
});

configApi.interceptors.request.use(
  async (config) => {
    const token = Cookies.get("accessTokenAdmin");
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

      const refreshToken = Cookies.get("refreshTokenAdmin");

      if (!refreshToken) {
        return Promise.reject(err);
      }

      try {
        const res = await axios.post(
          "http://localhost:3000/admin/auth/refresh-token",
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
        if (newAccessToken) {
          Cookies.set("accessToken", newAccessToken, {
            expires: 1 / 24, // Thời gian hết hạn là 1 giờ
          });
        }

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return configApi(originalRequest);
      } catch (refreshErr: any) {
        const response = (refreshErr as any)?.response;

        if (response?.data?.detail === "JWT expired") {
          alert("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
          document.location.href = "/signin";
          localStorage.removeItem("isLogin");
          localStorage.removeItem("persist:auth");
          localStorage.removeItem("user");
          Cookies.remove("accessTokenAdmin");
          Cookies.remove("refreshTokenAdmin");
        } else if (response?.status === 500) {
          alert("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
          document.location.href = "/signin";
          localStorage.removeItem("isLogin");
          localStorage.removeItem("persist:auth");
          localStorage.removeItem("user");
          Cookies.remove("accessTokenAdmin");
          Cookies.remove("refreshTokenAdmin");
        }

        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export { configApi };
