export function LeastCommonMultiple (mas: number[]): number {
  const n = mas.length;
  let a = Math.abs(mas[0]);
  for (let i = 1; i < n; i++) {
     let b = Math.abs(mas[i]);
     let c = a;
     while (a && b) {
       a > b ? a %= b : b %= a;
     }
     a = Math.abs(c * mas[i]) / (a + b);
  }
  return a;
}
