// import { generateReactNativeHelpers } from '@uploadthing/expo';
// import type { OurFileRouter } from '../../../api/src/uploadthing/upload-router';

// export const { useImageUploader, useDocumentUploader } =
//   generateReactNativeHelpers<OurFileRouter>({
//     url: `${process.env.EXPO_PUBLIC_SERVER_URL!}/api/uploadthing`,
//   });


import { generateReactNativeHelpers } from "@uploadthing/expo";
import type { OurFileRouter } from '../../../api/src/uploadthing/upload-router';

// 1. حل مشكلة Server-Side Rendering (ReferenceError: window is not defined)
// إذا كان الكود يعمل على السيرفر، نوفر كائن FormData وهمي حتى لا ينهار الـ Build
if (typeof window === "undefined" && typeof globalThis.FormData === "undefined") {
  (globalThis as any).FormData = class {};
}

// 2. حل مشكلة الأندرويد و الـ ArrayBuffer / Blobs داخل محرك Hermes (Expo Go)
const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  // التحقق من وجود خيارات وبنية للـ FormData
  if (options && options.body && typeof options.body === 'object') {
    const isFormData = options.body.constructor && options.body.constructor.name === 'FormData';
    
    if (isFormData) {
      const headers = new Headers(options.headers);
      // نلغي الـ content-type اليدوي لندع نظام تشغيل الموبايل يحدده مع الـ Boundary المناسب تلقائياً
      headers.delete("content-type");
      options.headers = headers;
    }
  }
  return globalThis.fetch(url, options);
};

// إنشاء الـ helpers مع تمرير الـ Type الخاص بك
export const helpers = generateReactNativeHelpers<OurFileRouter>({
  url: `http://192.168.1.105:5000/api/uploadthing`, // الـ IP الخاص بك المعرف بالـ Logs
  fetch: customFetch,
});

export const useImageUploader = helpers.useImageUploader;
export const useDocumentUploader = helpers.useDocumentUploader;
export const { useUploadThing } = helpers;

// import { generateReactNativeHelpers } from '@uploadthing/expo';
// import type { OurFileRouter } from '../../../api/src/uploadthing/upload-router';

// function getUploadThing() {
//   return generateReactNativeHelpers<OurFileRouter>({
//     url: `${process.env.EXPO_PUBLIC_SERVER_URL!}/api/uploadthing`,
//   });
// }

// export function useImageUploader(
//   ...args: Parameters<ReturnType<typeof getUploadThing>['useImageUploader']>
// ) {
//   return getUploadThing().useImageUploader(...args);
// }

// export function useDocumentUploader(
//   ...args: Parameters<ReturnType<typeof getUploadThing>['useDocumentUploader']>
// ) {
//   return getUploadThing().useDocumentUploader(...args);
// }