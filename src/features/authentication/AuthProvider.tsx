import { useState, type ReactNode } from "react";
import { AuthContext } from "./useAuth";
import { getUser,loginRequest,logoutRequest,registerRequest,type User } from "./authStore";


export function AuthProvider({children}:{children: ReactNode}){
    const [user,setUser] = useState<User | null>(getUser);

    const login = async (email:string,password:string)=>{
        setUser(await loginRequest(email,password));
    };
    const register = async (name:string,email:string,password:string) => {
        setUser(await registerRequest(name,email,password));
    };
    const logout = () => {
        logoutRequest();
        setUser(null);
    };
    return <AuthContext.Provider value={{user,login,register,logout}}>{children}</AuthContext.Provider>;
}