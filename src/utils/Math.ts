export function LeastCommonMultiple (mas: number[])
{
    var  n = mas.length, a = Math.abs(mas[0]);
    for (var i = 1; i < n; i++)
     { var b = Math.abs(mas[i]), c = a;
       while (a && b){ a > b ? a %= b : b %= a; }
       a = Math.abs(c*mas[i])/(a+b);
     }
    return a;
}
