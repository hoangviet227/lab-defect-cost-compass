import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { StackedLogo } from "@/components/StackedLogo";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signIn(loginEmail, loginPassword);
      toast({ title: "Đăng nhập thành công" });
    } catch (error: any) {
      toast({ title: "Đăng nhập thất bại", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword.length < 6) {
      toast({ title: "Mật khẩu quá ngắn", description: "Tối thiểu 6 ký tự", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await signUp(signupEmail, signupPassword, signupName);
      toast({ title: "Đã tạo tài khoản", description: "Kiểm tra email để xác nhận." });
    } catch (error: any) {
      toast({ title: "Đăng ký thất bại", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[420px] border border-border rounded-md p-8 space-y-6">
        <div className="flex flex-col items-start gap-3">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <StackedLogo size={16} />
            <span className="text-[14px] font-bold text-foreground tracking-[0.08em] uppercase">Xưởng In Manager</span>
          </Link>
          <p className="text-[13px] text-muted-foreground">Hệ thống quản lý xưởng in gia công</p>
        </div>

        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2 h-9 p-0.5">
            <TabsTrigger value="login" className="text-[12px]">Đăng nhập</TabsTrigger>
            <TabsTrigger value="signup" className="text-[12px]">Đăng ký</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[12px]">Email</Label>
                <Input type="email" placeholder="ban@xuong.vn" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required className="h-8 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[12px]">Mật khẩu</Label>
                <Input type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required className="h-8 text-[13px]" />
              </div>
              <Button type="submit" className="w-full h-8 text-[13px]" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Đăng nhập
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleSignup} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[12px]">Họ tên</Label>
                <Input type="text" placeholder="Nguyễn Văn A" value={signupName} onChange={(e) => setSignupName(e.target.value)} required className="h-8 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[12px]">Email</Label>
                <Input type="email" placeholder="ban@xuong.vn" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required className="h-8 text-[13px]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[12px]">Mật khẩu</Label>
                <Input type="password" placeholder="Tối thiểu 6 ký tự" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={6} className="h-8 text-[13px]" />
              </div>
              <Button type="submit" className="w-full h-8 text-[13px]" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Tạo tài khoản
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-left text-[11px] text-muted-foreground pt-2">
          © {new Date().getFullYear()} Xưởng In Manager
        </p>
      </div>
    </div>
  );
}
