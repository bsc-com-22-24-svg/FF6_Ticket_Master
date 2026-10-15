import {redirect} from '@tanstack/react-router';
import { getUser,type Role } from './authStore';


export function requireAuth(role?:Role):(ctx: {location:{href:string}}) => void {
    return({ location })=>{
        const user = getUser();
        if(!user) throw redirect({to: '/login' , search:{ redirect:location.href}});
        if(role && user.role !== role) throw redirect({to: '/events'});
    };
}