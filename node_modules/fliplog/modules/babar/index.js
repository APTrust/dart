// @TODO clean up this coffee mess
// http://js2.coffee/
// https://github.com/stephan83/babar/blob/master/src/babar.coffee
var avgBkt,
  bucketize,
  createBkt,
  drawChart,
  drawRow,
  drawRowChart,
  drawRowLabel,
  minMax,
  minMaxBkt,
  normalizeBkt,
  pointsMinMaxUniqueX,
  tc,
  indexOf =
    [].indexOf ||
    function(item) {
      for (var i = 0, l = this.length; i < l; i++) {
        if (i in this && this[i] === item) return i
      }
      return -1
    }

tc = function(x, c) {
  return Array(x + 1).join(c)
}

minMax = function(min, max, val) {
  return Math.max(min, Math.min(max, val))
}

pointsMinMaxUniqueX = function(points) {
  var maxX, maxY, minX, minY, ref, valX
  valX = []
  ;(ref = points.reduce(
    (prev, point) => {
      var ref
      if (((ref = point[0]), indexOf.call(valX, ref) < 0)) {
        valX.push(point[0])
      }
      return [
        Math.min(prev[0], point[0]),
        Math.max(prev[1], point[0]),
        Math.min(prev[2], point[1]),
        Math.max(prev[3], point[1]),
      ]
    },
    [Infinity, -Infinity, Infinity, -Infinity]
  )), (minX = ref[0]), (maxX = ref[1]), (minY = ref[2]), (maxY = ref[3])
  return {
    minX,
    maxX,
    minY,
    maxY,
    uniqueX: valX.length,
  }
}

drawRowLabel = function(r, lblY, lblYW) {
  var lbl
  lbl = r === 0 || lblY[r] !== lblY[r - 1] ? lblY[r] : ''
  return '' + tc(lblYW - lbl.length - 1, ' ') + lbl
}

drawRowChart = function(r, bkt, bktW, c, h) {
  var v
  return (function() {
    var j, len, results
    results = []
    for ((j = 0), (len = bkt.length); j < len; j++) {
      v = bkt[j]
      switch ((r > v && 1) ||
        ((r > v - 1 || r === v || r === h - 1) && 2) ||
        3) {
        case 1:
          if (c === 'ascii') {
            results.push(tc(bktW, ' '))
          }
          else {
            results.push(tc(bktW, '_'.black))
          }
          break
        case 2:
          if (c === 'ascii') {
            results.push(tc(bktW, ' '))
          }
          else {
            results.push(
              tc(Math.max(1, bktW - 1), '_'[c]) + (bktW > 1 ? '_'.black : '')
            )
          }
          break
        case 3:
          if (c === 'ascii') {
            results.push(tc(bktW, 'X'))
          }
          else {
            results.push(
              tc(Math.max(1, bktW - 1), ' '[c].inverse) +
                (bktW > 1 ? '_'.black : '')
            )
          }
          break
        default:
          results.push(void 0)
      }
    }
    return results
  })().join('')
}

drawRow = function(r, lblY, lblYW, bkt, bktW, c, h) {
  return drawRowLabel(r, lblY, lblYW) + ' ' + drawRowChart(r, bkt, bktW, c, h)
}

drawChart = function(h, lblY, lblYW, bkt, bktW, c) {
  var r
  return (function() {
    var j, ref, results
    results = []
    for (
      r = j = ref = h - 1;
      ref <= 0 ? j <= 0 : j >= 0;
      r = ref <= 0 ? ++j : --j
    ) {
      results.push(drawRow(r, lblY, lblYW, bkt, bktW, c, h))
    }
    return results
  })().join('\n')
}

createBkt = function(points, numBkts, minX, diffX) {
  var bkt, i, j, k, len, p, ref, u, x, y
  bkt = []
  for ((j = 0), (len = points.length); j < len; j++) {
    p = points[j]
    ;(x = p[0]), (y = p[1])
    u = Math.min(numBkts - 1, Math.floor((x - minX) / diffX * numBkts))
    if (bkt[u] == null) {
      bkt[u] = []
    }
    bkt[u].push(p)
  }
  for (
    (i = k = 0), (ref = bkt.length);
    ref >= 0 ? k < ref : k > ref;
    i = ref >= 0 ? ++k : --k
  ) {
    if (!bkt[i]) {
      bkt[i] = []
    }
  }
  return bkt
}

avgBkt = function(bkt) {
  var j, len, prev, results, values
  prev = 0
  results = []
  for ((j = 0), (len = bkt.length); j < len; j++) {
    values = bkt[j]
    if (values.length) {
      results.push(
        (prev =
          1 /
          values.length *
          values.reduce((prev, curr) => {
            return prev + curr[1]
          }, 0))
      )
    }
    else {
      results.push(prev)
    }
  }
  return results
}

minMaxBkt = function(bkt) {
  return {
    min: Math.min.apply(null, bkt),
    max: Math.max.apply(null, bkt),
  }
}

normalizeBkt = function(bkt, min, diff, h) {
  var j, len, results, v
  results = []
  for ((j = 0), (len = bkt.length); j < len; j++) {
    v = bkt[j]
    results.push((v - min) / diff * h)
  }
  return results
}

bucketize = function(points, numBkts, minX, diffX, minY, maxY, h) {
  var bkt, diff, max, min, ref
  bkt = avgBkt(createBkt(points, numBkts, minX, diffX))
  ;(ref = minMaxBkt(bkt)), (min = ref.min), (max = ref.max)
  if (maxY) {
    max = maxY
  }
  if (minY) {
    min = minY
  }
  diff = max - min
  return {
    bkt: normalizeBkt(bkt, min, diff, h),
    min,
    max,
    diff,
  }
}

module.exports = function babar(points, options) {
  var bkt,
    bktW,
    caption,
    color,
    diff,
    diffX,
    diffY,
    height,
    j,
    k,
    l,
    lbl,
    lblXI,
    lblXN,
    lblXW,
    lblY,
    lblYW,
    max,
    maxX,
    maxY,
    min,
    minX,
    minY,
    numBkts,
    out,
    ref,
    ref1,
    ref2,
    ref3,
    ref4,
    ref5,
    ref6,
    ref7,
    ref8,
    ref9,
    u,
    uniqueX,
    v,
    width,
    x,
    xFractions,
    yFractions
  if (options == null) {
    options = {}
  }
  (ref3 = [
    options.caption,
    (ref = options.color) != null ? ref : 'cyan',
    (ref1 = options.width) != null ? ref1 : 80,
    (ref2 = options.height) != null ? ref2 : 15,
    options.xFractions,
    options.yFractions,
    options.minX,
    options.maxX,
    options.minY,
    options.maxY,
  ]), (caption = ref3[0]), (color = ref3[1]), (width = ref3[2]), (height =
    ref3[3]), (xFractions = ref3[4]), (yFractions = ref3[5]), (minX =
    ref3[6]), (maxX = ref3[7]), (minY = ref3[8]), (maxY = ref3[9])
  if (color !== 'ascii') {
    require('colors')
  }
  (ref4 = pointsMinMaxUniqueX(points)), (minX = ref4.minX), (maxX =
    ref4.maxX), (minY = ref4.minY), (maxY = ref4.maxY), (uniqueX = ref4.uniqueX)
  if (options.minX) {
    minX = options.minX
  }
  if (options.maxX) {
    maxX = options.maxX
  }
  if (options.minY) {
    minY = options.minY
  }
  if (options.maxY) {
    maxY = options.maxY
  }
  (ref5 = [maxX - minX, maxY - minY]), (diffX = ref5[0]), (diffY = ref5[1])
  height -= 1 + !!caption
  if (yFractions == null) {
    yFractions = minMax(0, 8, Math.log(height / diffY * 5) / Math.LN10)
  }
  lblYW =
    1 +
    Math.max(minY.toFixed(yFractions).length, maxY.toFixed(yFractions).length)
  width -= lblYW
  numBkts = Math.min(uniqueX, width - lblYW)
  bktW = Math.floor((width - lblYW) / numBkts)
  if (xFractions == null) {
    xFractions = minMax(0, 8, Math.log(numBkts / diffX * 5) / Math.LN10)
  }
  (ref6 = bucketize(points, numBkts, minX, diffX, minY, maxY, height)), (bkt =
    ref6.bkt), (min = ref6.min), (max = ref6.max), (diff = ref6.diff)
  lblY = []
  for (
    v = j = ref7 = height - 1;
    ref7 <= 0 ? j <= 0 : j >= 0;
    v = ref7 <= 0 ? ++j : --j
  ) {
    lbl = (min + diff * v / (height - 1)).toFixed(yFractions)
    lblY.unshift(lbl)
  }
  lblXW = 0
  for (
    (u = k = 0), (ref8 = numBkts);
    ref8 >= 0 ? k < ref8 : k > ref8;
    u = ref8 >= 0 ? ++k : --k
  ) {
    lbl = (minX + u * diffX / (numBkts - 1)).toFixed(xFractions)
    lblXW = Math.max(lblXW, lbl.length)
  }
  lblXN = numBkts
  lblXI = 1
  while (lblXN * lblXW >= numBkts * bktW) {
    lblXN = Math.floor(lblXN / 2)
    lblXI *= 2
  }
  out = ''
  if (caption != null) {
    out += tc(lblYW, ' ')
    out += color === 'ascii' ? caption : caption.bold
    out += '\n'
  }
  out += drawChart(height, lblY, lblYW, bkt, bktW, color) + '\n'
  out += tc(lblYW, ' ')
  for (
    (x = l = 0), (ref9 = lblXN);
    ref9 >= 0 ? l < ref9 : l > ref9;
    x = ref9 >= 0 ? ++l : --l
  ) {
    u = x * lblXI
    lbl = (minX + u * diffX / (numBkts - 1)).toFixed(xFractions)
    out += lbl
    out += tc(bktW * lblXI - lbl.length, ' ')
  }
  return out
}
