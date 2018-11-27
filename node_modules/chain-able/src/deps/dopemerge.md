// https://ozh.github.io/ascii-tables/
```js
+---------+----------+
|  Obj1   |    Obj2  |
+---------+----------+
| Boolean | Boolean  |
| String  | Boolean  |
| Boolean | String   |
| Number  | String   |
| ...     | ...      |
+---------+----------+
```

// and all in reverse, done
Special = Regex|Map|Set|Promise|Symbol|Function
String Number
String Boolean
String Object
String Array
String Special

Special [Num, Bool, Obj, Arr]
Num [Bool, Special, Obj, Arr]
Obj [Bool, Special, Num, Arr]
Bool [Obj, Special, Num, Arr]
Arr [Arr, Special, Num, Arr]


[
  'String',
  'Number',
  'Boolean',
  'Object',
  'Array',
  'Regex',
  'Map',
  'Set',
  'Promise',
  'Symbol',
  'Function',
]
