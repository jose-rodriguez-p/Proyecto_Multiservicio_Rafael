import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  if (isPlatformBrowser(platformId)) {
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser) {
      return true; 
    }
    
    console.warn('Acceso denegado. Redirigiendo al login...');
    router.navigate(['/login']);
    return false;
  }
  return false;
};