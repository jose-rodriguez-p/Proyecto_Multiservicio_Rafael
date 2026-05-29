import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Sistema } from './sistema/sistema';
import { Dashboard } from './sistema/dashboard/dashboard';
import { Cliente } from './sistema/cliente/cliente';
import { Trabajador } from './sistema/trabajador/trabajador';
import { Proveedor } from './sistema/proveedor/proveedor';
import { AgregarTrabajador } from './sistema/trabajador/agregar-trabajador/agregar-trabajador';
import { EditarTrabajdor } from './sistema/trabajador/editar-trabajdor/editar-trabajdor';
export const routes: Routes = [
    {
        path:'',redirectTo:'login',pathMatch:'full'
    },
    {
        path:'login',component:Login
    },
    {
        path:'sistema',component:Sistema,
        children:[
            {
                path:"dashboard",component:Dashboard
            },
            {
                path:"cliente",component:Cliente,
                
            },
            {
                path:"trabajador",component:Trabajador,
                children:[
                    {
                        path:"agregar-trabajador",component:AgregarTrabajador
                    },
                    {
                        path:"editar-trabajador",component:EditarTrabajdor
                    }
                ]
            },
            {
                path:"proveedor",component:Proveedor
            }
        ]
    }
];
