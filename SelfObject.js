/*
* Self object model written in JavaScript. 
* Use of object inheritance, message passing, and slots.
*/

class SelfObject {
  constructor() {
    this.slots = {};        // name -> object
    this.parents = new Set(); // parent slot names
    this.messages = [];     // optional list of messages
    this.primitive = null;  // optional primitive value
    this.primitiveFn = null;// optional primitive function
  }

  /*
  evaluate — given an object, evaluate it and return the result.
  If the object has a list of messages, the object copies itself,
  sends the messages to the copy, and returns the last result.
  */
  evaluate() {
    if (this.primitive !== null) {
      return this.copy(); // return copy with same primitive value
    }
    if (this.primitiveFn) {
      return this.primitiveFn(this);
    }
    if (this.messages.length > 0) {
      let currentObj = this.copy();
      let result = null;
      for (const msg of this.messages) {
        result = currentObj.sendAMessage(msg);
        if (result) {
          currentObj = result;
        } else {
          throw new Error(`Message '${msg}' not found`);
        }
      }
      return result;
    }
    return this;
  }

  /*
  copy — given an object, return a copy of it
  */
  copy() {
    const newObj = new SelfObject();
    newObj.slots = { ...this.slots };
    newObj.parents = new Set(this.parents);
    newObj.messages = [...this.messages];
    newObj.primitive = this.primitive;
    newObj.primitiveFn = this.primitiveFn;
    return newObj;
  }

  /*
  sendAMessage —- given an object and a string, send the message to the object.
  The object corresponding to the message
  (I.e., in the slot with the same name as the message) is evaluated and returned.
  If the object doesn’t directly have a slot with that name,
  recursively look in the parent slots via a breadth-first search.
  */
  sendAMessage(name) {
    if (this.slots[name]) {
      return this.slots[name].evaluate();
    }
    let visited = new Set();
    let queue = [...this.parents].map(p => this.slots[p]);
    while (queue.length > 0) {
      let current = queue.shift();
      if (!current || visited.has(current)) continue;
      visited.add(current);
      if (current.slots[name]) {
        return current.slots[name].evaluate();
      }
      queue.push(...[...current.parents].map(p => current.slots[p]));
    }
    return null;
  }

  /*
  sendAMessageWithParameters — given an object and a string and a second object (the “parameter”),
  send the message to the first object, passing the second object as a
  parameter to the message by setting the “parameter” slot on the object.
  If the object doesn’t directly have a slot with that name,
  recursively look in the parent slots via a breadth-first search.
 */
  sendAMessageWithParameters(name, paramObj) {
    if (this.slots[name]) {
      const target = this.slots[name].copy();
      target.slots["parameter"] = paramObj;
      return target.evaluate();
    }
    let visited = new Set();
    let queue = [...this.parents].map(p => this.slots[p]);
    while (queue.length > 0) {
      let current = queue.shift();
      if (!current || visited.has(current)) continue;
      visited.add(current);
      if (current.slots[name]) {
        const target = current.slots[name].copy();
        target.slots["parameter"] = paramObj;
        return target.evaluate();
      }
      queue.push(...[...current.parents].map(p => current.slots[p]));
    }
    return null;
  }

  /*
  assignSlot — given an object, a string, and an object,
  set the slot in the first object named by the string to refer to the second object.
 */
  assignSlot(name, obj) {
    this.slots[name] = obj;
  }

  /*
  makeParent — given an object and a string,
  designate the slot named by the string (if it exists) as a parent slot.
 */
  makeParent(name) {
    if (this.slots[name]) {
      this.parents.add(name);
    }
  }

  /*
  assignParentSlot — given an object, a string, and an object, call assignSlot then makeParent.
  */
  assignParentSlot(name, obj) {
    this.assignSlot(name, obj);
    this.makeParent(name);
  }

  /*
  print — given an object, produce a printed representation of the object as a string.
  Alternatively, you may implement draw,
  which draws a graphical representation of the object.
  */
  print() {
    const slotNames = Object.keys(this.slots).join(", ");
    const parentNames = Array.from(this.parents).join(", ");
    const messages = this.messages.join(", ");
    return `SelfObject(primitive: ${this.primitive}, slots: {${slotNames}}, parents: {${parentNames}}, messages: [${messages}])`;
  }
}

// Example usage
const objA = new SelfObject();
objA.primitive = "I am A";

const objB = new SelfObject();
objB.primitive = "I am B";

const objC = new SelfObject();
objC.primitive = "I am C";

objA.assignSlot("b", objB);
objA.assignParentSlot("c", objC);

objA.messages.push("b");
objA.messages.push("c");

const result = objA.evaluate();
console.log(result.print());      // should show objC
console.log(result.primitive);    // "I am C"
