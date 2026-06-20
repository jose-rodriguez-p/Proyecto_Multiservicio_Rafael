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
import { AgregarProducto } from './sistema/producto/agregar-producto/agregar-producto';
import { EditarProducto } from './sistema/producto/editar-producto/editar-producto';
import { Configuracion } from './sistema/configuracion/configuracion';
import { Servicio } from './sistema/servicio/servicio';
import { Mantenimiento } from './sistema/servicio/mantenimiento/mantenimiento';
import { CrearMantenimiento } from './sistema/servicio/mantenimiento/crear-mantenimiento/crear-mantenimiento';
import { MantenimientoIndex } from './sistema/servicio/mantenimiento/mantenimiento-index/mantenimiento-index';
import { VentasIndex } from './sistema/servicio/ventas/ventas-index/ventas-index';
import { CrearVenta } from './sistema/servicio/ventas/crear-venta/crear-venta';
import { Reabastecimiento } from './sistema/reabastecimiento/reabastecimiento';
import { authGuard } from './auth.guard';
import { Rol } from './sistema/configuracion/rol/rol';
import { AgregarRol } from './sistema/configuracion/rol/agregar-rol/agregar-rol';
import { EditarRol } from './sistema/configuracion/rol/editar-rol/editar-rol';
import { EditarProveedor } from './sistema/proveedor/editar-proveedor/editar-proveedor';
import { AgregarProveedor } from './sistema/proveedor/agregar-proveedor/agregar-proveedor';
import { ActualizarContrasena } from './sistema/configuracion/actualizar-contrasena/actualizar-contrasena';
import { AgregarCliente } from './sistema/cliente/agregar-cliente/agregar-cliente';
import { EditarCliente } from './sistema/cliente/editar-cliente/editar-cliente';


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'sistema',
    component: Sistema,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'cliente',
        component: Cliente,
        children:[
          {path: 'agregar-cliente',component:AgregarCliente},
          {path:'editar-cliente',component:EditarCliente}
        ]
      },
      {
        path: 'producto',
        component: Producto,
        children: [
          { path: 'agregar-producto', component: AgregarProducto },
          { path: 'editar-producto/:id', component: EditarProducto },
        ],
      },
      {
        path: 'reabastecimiento',
        component: Reabastecimiento,
      },
      {
        path: 'servicio',
        component: Servicio,
        children: [
          { path: 'ventas', component: VentasIndex },
          { path: 'crearVenta', component: CrearVenta},
          { path: 'mantenimiento', component: Mantenimiento },
        ],
      },
      {
        path: 'configuracion',
        component: Configuracion,
        children: [
          {
            path: 'rol',
            component: Rol,
            children: [
              { path: 'agregar-rol', component: AgregarRol },
              { path: 'editar-rol/:id', component: EditarRol },
            ],
          },
          {
            path: 'actualizar-contrasena',
            component: ActualizarContrasena,
          },
        ],
      },
      {
        path: 'trabajador',
        component: Trabajador,
        children: [
          {
            path: 'agregar-trabajador',
            component: AgregarTrabajador,
          },
          {
            path: 'editar-trabajador',
            component: EditarTrabajdor,
          },
        ],
      },
      {
        path: 'proveedor',
        component: Proveedor,
        children: [
          { path: 'agregar-proveedor', component: AgregarProveedor },
          { path: 'editar-proveedor/:ruc', component: EditarProveedor },
        ],
      },
    ],
  },
];
