import axios from "axios";
import Cookies from "js-cookie";
const configApi = axios.create({
  baseURL: "https://backend-menory-app.vercel.app",
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
          "https://backend-menory-app.vercel.app/admin/auth/refresh-token",
          {},
          {
            headers: {
              "x-refresh-token": refreshToken,
            },
          }
        );

        const newAccessToken = res.data?.data?.assessToken;
        if (!newAccessToken) {
          throw new Error("Không nhận được access token mới");
        }
        if (newAccessToken) {
          Cookies.set("accessTokenAdmin", newAccessToken, {
            expires: 1 / 24,
          });
        }

        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return configApi(originalRequest);
      } catch (refreshErr: any) {
        const response = (refreshErr as any)?.response;
        console.log("response", response)
        if (response?.status === 401) {
          alert("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
          document.location.href = "/signin";
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

// Ngày chạy