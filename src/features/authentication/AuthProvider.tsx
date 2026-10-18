import { useState, type ReactNode } from "react";
import { AuthContext } from "./useAuth";
import { getUser,loginRequest,logoutRequest,registerRequest,type User } from "./authStore";


export function AuthProvider({children}:{children: ReactNode}){
    const [user,setUser] = useState<User | null>(getUser);

    const login = async (email:string,password:string)=>{
        const next = await loginRequest(email,password);
        setUser(next);
        return next;
    };
    const register = async (name:string,email:string,password:string) => {
        const next = await registerRequest(name,email,password);
        setUser(next);
        return next;
    };
    const logout = () => {
        logoutRequest();
        setUser(null);
    };
    return <AuthContext.Provider value={{user,login,register,logout}}>{children}</AuthContext.Provider>;
}