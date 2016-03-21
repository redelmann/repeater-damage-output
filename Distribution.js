
/**
 * An Item is a pair of a value and its probability.
 *
 * @constructor
 * @param {value} The value, can be of any type.
 * @param {value} The probability, should be of type Fraction
 *                (from infusion/Fraction.js) and between 0 and 1.
 */
function Item(value, probability) {
  this.value = value;
  this.probability = probability;
}

/**
 * A Distribution is a mapping from values to their probability.
 * For non-empty distributions, the sum of all probabilities
 * should always be 1.
 *
 * The constructor is not intended to be used directly. Instead,
 * functions of Distributions and the methods of this class should
 * be used.
 *
 * @constructor
 * @param {content} An associative array mapping values to Item objects.
 * @see Distributions for ways to build Distribution objects.
 */
function Distribution(content) {

  // The hashtable mapping values to pairs of values and probability.
  // 
  // We store the pair of value and probability instead of simply the
  // probability due to the fact that the key of the hashmap is converted
  // to a string.
  this._content = content;
}

/** 
 * Applies a function to the values of this Distribution.
 *
 * @param {toResult} The function to apply on each value. 
 * @return {Distibution} The Distribution of the results.
 */ 
Distribution.prototype.map = function(toResult) {
  var newContent = {};
  var domain = this.domain();
  for (var i = 0; i < domain.length; i++) {
    var oldValue = domain[i];
    var newValue = toResult(oldValue);
    var aliasItem = newContent[newValue];
    var newProb = this._content[oldValue].probability;
    if (aliasItem !== undefined) {
      newProb = newProb.add(aliasItem.probability);
    }
    newContent[newValue] = new Item(newValue, newProb);
  }
  return new Distribution(newContent);
}

/**
 * Applies a function that returns a Distribution to
 * each value of this Distribution.
 *
 * All resulting distributions are combined into a single one.
 * The contribution of each resulting Distribution is proportional
 * to the probability of the value preimage in this Distribution.
 *
 * @param {toDistribution} The function to apply on each value.
 * @return {Distribution} The Distribution of the results.
 */
Distribution.prototype.flatMap = function(toDistribution) {
  var newContent = {};
  var oldDomain = this.domain();
  for (var i = 0; i < oldDomain.length; i++) {
    var oldValue = oldDomain[i];
    var newDistribution = toDistribution(oldValue);
    var newDomain = newDistribution.domain();
    for (var j = 0; j < newDomain.length; j++) {
      var newValue = newDomain[j];
      var aliasItem = newContent[newValue];
      var newProb = newDistribution._content[newValue].probability.mul(
        this._content[oldValue].probability);
      if (aliasItem !== undefined) {
        newProb = newProb.add(aliasItem.probability);
      }
      newContent[newValue] = new Item(newValue, newProb);
    }
  }
  return new Distribution(newContent);
}

/**
 * Combines two Distribution objects using a combiner function.
 * 
 * @param {combiner} The binary function to combine values of this and that.
 * @param {that} The Distribution with which to combine.
 * @return {Distribution} The Distribution of the combinations.
 */
Distribution.prototype.combine = function(combiner, that) {
  var newContent = {};
  var thisDomain = this.domain();
  var thatDomain = that.domain();
  for (var i = 0; i < thisDomain.length; i++) {
    var thisValue = thisDomain[i];
    var thisProb = this._content[thisValue].probability;
    for (var j = 0; j < thatDomain.length; j++) {
      var thatValue = thatDomain[j];
      var thatProb = that._content[thatValue].probability;
      var newValue = combiner(thisValue, thatValue);
      var aliasItem = newContent[newValue];
      var newProb = thisProb.mul(thatProb);
      if (aliasItem !== undefined) {
        newProb = newProb.add(aliasItem.probability);
      }
      newContent[newValue] = new Item(newValue, newProb);
    }
  }
  return new Distribution(newContent);
}

/**
 * Returns all values with non-zero probability.
 *
 * @return {array} Values with non-zero probability.
 */
Distribution.prototype.domain = function() {
  var keys = [];
  for (var key in this._content) {
    if (this._content.hasOwnProperty(key)) {
      keys.push(this._content[key].value);
    }
  }
  return keys;
}

/**
 * Returns the probability of a certain value.
 *
 * @param {value} The value to test.
 * @return {Fraction} The probability of the value.
 */
Distribution.prototype.probabilityAt = function(value) {
  var item = this._content[value];
  if (item !== undefined) {
    return item.probability;
  }
  return Fraction(0);
}


/**
 * Returns the probability of a certain predicate being true.
 *
 * @param {value} The predicate to test.
 * @return {Fraction} The probability of having a value
 *                    that satifies the predicate.
 */
Distribution.prototype.probability = function(predicate) {
  var domain = this.domain();
  var prob = Fraction(0);
  for (var i = 0; i < domain.length; i++) {
    if (predicate(domain[i])) {
      prob = prob.add(this.probabilityAt(domain[i]));
    }
  }
  return prob;
}


var Distributions = {

  /**
   * Uniform distribution of the elements.
   *
   * @param {elements} An array of values.
   * @return {Distribution} The uniform distribution over the elements.
   */
  "uniform": function(elements) {
    var n = elements.length;
    var p = new Fraction(1).div(n);
    var content = {};
    for (var i = 0; i < n; i++) {
      var aliasItem = content[elements[i]];
      var item = new Item(elements[i], p);
      if (aliasItem !== undefined) {
        item.probability = item.probability.add(aliasItem.probability);
      }
      content[elements[i]] = item;
    }
    return new Distribution(content);
  },

  /**
   * Distribution that always returns the same value.
   *
   * @param {value} The only value in the distribution.
   * @return {Distribution} The Distribution that assigns to the value
   *                        the probability 1.
   */
  "always": function(value) {
    return Distributions.uniform([value]);
  },

  /**
   * Uniform Distribution over numbers between 1 and n inclusive.
   *
   * @param {n} The maximum value of the distribution.
   * @return {Distribution} The uniform Distribution of numbers
   *                        between 1 and n inclusive.
   */
  "dice": function(n) {
    var values = [];
    for (var i = 1; i <= n; i++) {
      values.push(i);
    }
    return Distributions.uniform(values);
  },

  "trials": function(n, distribution) {
    var q = distribution.probabilityAt(false);
    var p = Fraction(1).sub(q);

    var current = Fraction(1);
    var ps = [current];
    for (var i = 1; i <= n; i++) {
      current = current.mul(p);
      ps[i] = current;
    }

    current = Fraction(1);
    var qs = [];
    qs[n] = current;
    for (var i = n - 1; i >= 0; i--) {
      current = current.mul(q);
      qs[i] = current;
    }

    var coefs = [Fraction(1)];
    current = Fraction(1);
    for (var i = 0; i < n; i++) {
      current = current.mul(Fraction(n - i)).div(Fraction(i + 1));
      coefs.push(current);
    }

    content = {};
    for (var i = 0; i <= n; i++) {
      content[i] = new Item(i, coefs[i].mul(ps[i]).mul(qs[i]));
    }

    return new Distribution(content);
  }
}