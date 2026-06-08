import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Sistema } from './sistema/sistema';
import { Dashboard } from './sistema/dashboard/dashboard';
import { Cliente } from './sistema/cliente/cliente';
import { Trabajador } from './sistema/trabajador/trabajador';
import { Proveedor } from './sistema/proveedor/proveedor';
import { AgregarTrabajador } from './sistema/trabajador/agregar-trabajador/agregar-trabajador';
import { EditarTrabajdor } from './sistema/trabajador/editar-trabajdor/editar-trabajdor';
import { Producto } from './sistema/producto/producto';
import { Configuracion } from './sistema/configuracion/configuracion';
import { Servicio } from './sistema/servicio/servicio';
import { Venta } from './sistema/servicio/venta/venta';
import { Mantenimiento } from './sistema/servicio/mantenimiento/mantenimiento';
import { Reabastecimiento } from './sistema/reabastecimiento/reabastecimiento';
import { authGuard } from './auth.guard';

export const routes: Routes = [
    {
        path:'',redirectTo:'login',pathMatch:'full'
    },
    {
        path:'login',component:Login
    },
    {
        path:'sistema',component:Sistema,
        canActivate: [authGuard],
        children:[
            {
                path:"",redirectTo:"dashboard",pathMatch:"full"
            },
            {
                path:"dashboard",component:Dashboard
            },
            {
                path:"cliente",component:Cliente,
            },
            {
                path:"producto",component:Producto
            },
            {
                path:"reabastecimiento",component:Reabastecimiento
            },
            {
                path: "servicio",
                component: Servicio,
                children: [
                    { path: "venta", component: Venta },
                    { path: "mantenimiento", component: Mantenimiento }
                ]
            },
            {
                path:"configuracion",component:Configuracion
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


