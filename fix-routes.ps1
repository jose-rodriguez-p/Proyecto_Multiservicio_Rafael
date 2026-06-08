$path="src/app/app.routes.ts"
$text=Get-Content $path -Raw
$oldImport = "import { Servicio } from './sistema/servicio/servicio';
import { Reabastecimiento } from './sistema/reabastecimiento/reabastecimiento';
"
$newImport = "import { Servicio } from './sistema/servicio/servicio';
import { Venta } from './sistema/servicio/venta/venta';
import { Mantenimiento } from './sistema/servicio/mantenimiento/mantenimiento';
import { Reabastecimiento } from './sistema/reabastecimiento/reabastecimiento';
"
$text = $text.Replace($oldImport,$newImport)
$oldChildren = "                children: [
                    { path: ""venta"", component: Servicio },
                    { path: ""mantenimiento"", component: Servicio }
                ]"
$newChildren = "                children: [
                    { path: ""venta"", component: Venta },
                    { path: ""mantenimiento"", component: Mantenimiento }
                ]"
$text = $text.Replace($oldChildren,$newChildren)
Set-Content $path -Value $text
Write-Host 'updated'
