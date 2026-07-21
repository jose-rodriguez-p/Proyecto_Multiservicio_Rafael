import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor HTTP funcional para Angular.
 * Recupera el usuario activo de localStorage ('currentUser') y lo añade
 * como cabecera 'X-User-Logged' en todas las peticiones HTTP salientes.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let currentUserStr = null;
  
  // Verificación de window para evitar errores si se ejecuta en Server Side Rendering (SSR)
  if (typeof window !== 'undefined' && window.localStorage) {
    currentUserStr = localStorage.getItem('currentUser');
  }

  if (currentUserStr) {
    try {
      const user = JSON.parse(currentUserStr);
      if (user && user.username) {
        const clonedReq = req.clone({
          headers: req.headers.set('X-User-Logged', user.username)
        });
        return next(clonedReq);
      }
    } catch (e) {
      console.error('Error parsing currentUser from localStorage', e);
    }
  }

  return next(req);
};
