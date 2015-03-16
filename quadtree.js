const QT_NW = 0;
const QT_NE = 1;
const QT_SW = 2;
const QT_SE = 3;

function quadtreeNew(x, y, width, height) {
  return {
    x: x,
    y: y,
    width: width,
    height: height,
    halfW: width / 2,
    halfH: height / 2,
    regions: [],
    point: null,
    depth: 0,
    count: 0,
  };
}

function quadtreeAddLoop(qt, point) {
  var region;

  while (qt) {
    if (!qt.point) {
      qt.point = point;
      qt = null;

    } else {
      region = quadtreeRegion(qt, point);

      if (!qt.regions[region]) {
        qt.regions[region] = quadtreeNew((region % 2) * qt.halfW + qt.x, Math.floor(region / 2) * qt.halfH + qt.y, qt.halfW, qt.halfH);
      }

      qt = qt.regions[region];
    }
  }
}

function quadtreeAdd(qt, point) {
  qt.count++;

  if (!qt.point) {
    qt.point = point;

  } else {
    var region = quadtreeRegion(qt, point);

    if (!qt.regions[region]) {
      qt.regions[region] = quadtreeNew((region % 2) * qt.halfW + qt.x, Math.floor(region / 2) * qt.halfH + qt.y, qt.halfW, qt.halfH);
    }

    qt.depth = quadtreeAdd(qt.regions[region], point) + 1;
  }

  return qt.depth;
}

function quadtreeRegion(qt, point) {
  var region;
  var x = point.x - qt.x;
  var y = point.y - qt.y;
  if (x < qt.halfW) {
    if (y < qt.halfH) {
      region = QT_NW;
    } else {
      region = QT_SW;
    }
  } else {
    if (y < qt.halfH) {
      region = QT_NE;
    } else {
      region = QT_SE;
    }
  }
  return region;
}

function quadtreeClosest(qt, point) {
  return quadtreeClosestRecurse(qt, point, {d: qt.width + qt.width, p: null}).p;
}

function quadtreeClosestRecurse(qt, point, best) {
  if (point.x < qt.x - best.d || point.y < qt.y - best.d
      || point.x > qt.x + qt.width + best.d || point.y > qt.y + qt.height + best.d) {
      return best;
  }

  if (qt.point) {
    var dist = distance(point, qt.point);

    if (dist < best.d) {
      best = {
        d: dist,
        p: qt.point,
      };
    }
  }

  for (var child of qt.regions) {
    if (child) {
      best = quadtreeClosestRecurse(child, point, best);
    }
  }

  return best;
}

function quadtreeIsWithin(qt, point, radius) {
  return quadtreeIsWithinRecurse(qt, point, radius, []);
}

function quadtreeIsWithinRecurse(qt, point, radius, points) {
  if (point.x < qt.x - radius || point.y < qt.y - radius
      || point.x > qt.x + qt.width + radius || point.y > qt.y + qt.height + radius) {
      return points;
  }

  if (qt.point) {
    var dist = distance(point, qt.point);

    if (dist < radius) {
      qt.point.d = dist;
      points.push(qt.point);
    }
  }

  for (var child of qt.regions) {
    if (child) {
      quadtreeIsWithinRecurse(child, point, radius, points);
    }
  }

  return points;
}

function quadtreeFits(qt, point) {
  if (point.x < qt.x - RADIUS || point.y < qt.y - RADIUS
      || point.x > qt.x + qt.width + RADIUS || point.y > qt.y + qt.height + RADIUS) {
      return true;
  }

  if (qt.point) {
    var dist = distance(point, qt.point);

    if (dist < RADIUS) {
      return false;
    }
  }

  for (var child of qt.regions) {
    if (child) {
      if (!quadtreeFits(child, point)) {
        return false;
      }
    }
  }

  return true;
}

/*
function quadtreeClosestRecurse(qt, point, best) {
  if (point.x < qt.x - best.d || point.y < qt.y - best.d
      || point.x > qt.x + qt.width + best.d || point.y > qt.y + qt.height + best.d) {
      return best;
  }

  if (qt.point) {
    var dist = distance(point, qt.point);

    if (dist < best.d) {
      best = {
        d: dist,
        p: qt.point,
      };
    }
  }

  for (var child of qt.regions) {
    if (child) {
      best = quadtreeClosestRecurse(child, point, best);
    }
  }

  return best;
}
*/

function distance(p1, p2) {
  if (!p1 || !p2) {
    debugger;
  }
  var dx = p1.x - p2.x;
  var dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}
