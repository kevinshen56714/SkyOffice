export function openInNewTab(url: string) {
  //window.open(url); // This not work on iOS Safari

  // This is a hack to open a new tab on iOS Safari
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link?.setAttribute('target', '_blank') // This only works on iOS Safari if all are https
  link.click()
}
