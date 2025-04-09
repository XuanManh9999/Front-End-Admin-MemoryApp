import { useState } from "react";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Cookies from "js-cookie";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { useNavigate } from "react-router";
import { apiLogin } from "../../services/auth";
import { message } from "antd";
import { getCurrentUser } from "../../services/user";
import { Auth } from "../../interface/auth";
export default function SignInForm() {
  const nav = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [dataLogin, setDataLogin] = useState<Auth>({
    username: "",
    password: "",
  });
  const handleOnChangeDataLogin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDataLogin((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLoginAdmin = async () => {
    const { status, refreshToken, accessToken } = await apiLogin(dataLogin);
    if (status === 200) {
      // Set accessToken hết hạn trong 1 giờ
      Cookies.set("accessTokenAdmin", accessToken, { expires: 1 / 24 }); // 1 giờ = 1/24 ngày
      // Set refreshToken hết hạn trong 1 ngày
      Cookies.set("refreshTokenAdmin", refreshToken, { expires: 1 }); // 1 ngày = 1 ngày

      const { data, status: statusCurr } = await getCurrentUser();

      if (statusCurr === 200 && data && data.roles[0].name === "ROLE_ADMIN") {
        message.success("Đăng nhập thành công");
        localStorage.setItem("user", JSON.stringify(data));
        localStorage.setItem("isLogin", "true");
        setTimeout(() => {
          nav("/");
        }, 1000);
      } else {
        message.error(
          "Đăng nhập thất bại bạn không có quyền truy cập vào trang này"
        );
        Cookies.remove("accessTokenAdmin");
        Cookies.remove("refreshTokenAdmin");
      }
    } else {
      message.error(
        "Đăng nhập không thành công vui lòng kiểm tra lại tài khoản và mật khẩu"
      );
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div>
            <h3 className="mb-5  text-lg font-semibold text-gray-800 dark:text-white/90">
              Đăng nhập
            </h3>
            <div className="space-y-6">
              <div>
                <Label>
                  Tên đăng nhập <span className="text-error-500">*</span>{" "}
                </Label>
                <Input
                  name="username"
                  value={dataLogin.username}
                  onChange={handleOnChangeDataLogin}
                  placeholder="nhập vào tên đăng nhập"
                />
              </div>
              <div>
                <Label>
                  Mật khẩu <span className="text-error-500">*</span>{" "}
                </Label>
                <div className="relative">
                  <Input
                    name="password"
                    value={dataLogin.password}
                    onChange={handleOnChangeDataLogin}
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập vào mật khẩu"
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>
              {/* <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    to="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">
                    Forgot password?
                  </Link>
                </div> */}
              <div>
                <Button className="w-full" size="sm" onClick={handleLoginAdmin}>
                  Đăng nhập
                </Button>
              </div>
            </div>

            {/* <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  to="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
                  Sign Up
                </Link>
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
