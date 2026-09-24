/**
 * Ąžuolynas International Students Film Festival
 * Email Templates Module
 * (Alias to email-templates.js to ensure both singular and plural names resolve seamlessly)
 */

if (typeof window !== "undefined" && typeof window.generateEmailHtml === "undefined") {
  const script = document.createElement("script");
  script.src = (window.location.pathname.includes("/lt/") || window.location.pathname.includes("/en/")) 
    ? "../email-templates.js" 
    : "email-templates.js";
  document.head.appendChild(script);
} else if (typeof importScripts === "function") {
  importScripts("email-templates.js");
}
