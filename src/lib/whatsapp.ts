export const whatsappLink = (phone: string, text: string) => {
const url = new URL('https://wa.me/' + phone.replace(/\D/g,''))
url.searchParams.set('text', text)
return url.toString()
}