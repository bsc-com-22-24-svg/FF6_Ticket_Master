import { createContext,useContext } from "react";
import type {User} from './authStore';


export interface AuthValue{
    user:User|null;
    login :(email:string, password:string) => Promise<void>;
    register: (name: string ,email:string,password:string)=> Promise<void>;
    logout:() => void;
}

export const AuthContext = createContext<AuthValue | null>(null);
export function useAuth(): AuthValue{
    const value = useContext(AuthContext);
    if(!value) throw new Error('UseAuth must be used inside<AuthProvider>');
    return value;
}