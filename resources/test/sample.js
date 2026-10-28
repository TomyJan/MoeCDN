/* 多行注释
 * 中文与 English
 */
const message = "Hello，世界";
export function greet(name = 'MoeCDN') {
  return `${message}, ${name}!`;
}
console.log(greet());
