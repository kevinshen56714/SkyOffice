export function openURL(url: string) {
  const canOpenNewTab = window.open(url, '_blank')

  // if the browser blocks the new tab, open the url in the current tab
  // this is the case for Safari on iOS
  if (!canOpenNewTab) {
    let a = document.createElement('a')
    a.href = url
    a.click()
  }
}
