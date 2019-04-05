

function geq(n) {
  return function(m) {
    return m >= n;
  };
}

function lt(n) {
  return function(m) {
    return m < n;
  }
}

function and(a, b) {
  return a && b;
}

function plus(a, b) {
  return a + b;
}

function rangedHit(n) {
  n = Math.max(2, n);

  if (n <= 6) {
    return Distributions.dice(6).map(geq(n));
  }
  else if (n == 7) {
    return Distributions.dice(6).flatMap(function(m) {
      if (m == 6) {
        return Distributions.dice(6).map(geq(4));
      }
      else {
        return Distributions.always(false);
      }
    });
  }
  else {
    return Distributions.always(false);
  }
}

function clamp(min, max, value) {
  return Math.max(min, Math.min(max, value));
}

function toWound(strength, toughness) {
  return clamp(2, 6, toughness - strength + 4);
}

function toArmorSave(save, piercing) {
  return clamp(2, 7, save + piercing);
}


function repeatingShots(toHit, unit) {
  var hit = rangedHit(toHit);
  var wound = Distributions.dice(6).map(geq(toWound(4, unit.toughness)));
  var armor = Distributions.dice(6).map(lt(toArmorSave(unit.armorSave, 2)));
  var ward = Distributions.dice(6).map(lt(clamp(2, 7, unit.wardSave)));
  return Distributions.trials(6, hit.combine(and, wound).combine(and, armor).combine(and, ward)).map(function(n) {
    return Math.min(n, unit.models * unit.wounds);
  });
}

function singleShot(toHit, unit) {

  return rangedHit(toHit).flatMap(function(isHit) {
    if (isHit) {
      var firstWound = Distributions.dice(6).map(geq(toWound(6, unit.toughness)));
      var ward = Distributions.dice(6).map(lt(clamp(2, 7, unit.wardSave)));
      var first = firstWound.combine(and, ward).flatMap(function(isWounded) {
        if (isWounded) {
          return Distributions.dice(3).map(function(multiWounds) {
            return Math.min(multiWounds, unit.wounds);
          });
        }
        else {
          return Distributions.always(0);
        }
      });

      var restWound = Distributions.dice(6).map(geq(toWound(3, unit.toughness)));
      var rest = restWound.combine(and, ward);

      var numberRest = Math.min(5, Math.min(unit.ranks, unit.models)) - 1;

      return first.combine(plus, Distributions.trials(numberRest, rest));
    }
    else {
      return Distributions.always(0);
    }
  });

}