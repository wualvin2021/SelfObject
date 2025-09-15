/*
Self object model written in JavaScript.
Use of object inheritance, message passing, and slots.
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
  evaluate — given an object, return the result of evaluating it.
  If the object has a primitive value, return a copy of the object.
  If it has a primitive function, call that function with the object and the parameter slot (if any) and return the result.
  If it has messages, send those messages in order and return the result of the last message.
  If none of these apply, return the object itself.
  */
  evaluate() {
    if (this.primitive !== null) {
      return this.copy(); // return copy with same primitive value
    }
    if (this.primitiveFn) {
      return this.primitiveFn(this, this.slots['parameter']);
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
  sendAMessage — breadth-first parent search
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
  sendAMessageWithParameters — BFS + cycle protection
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
  assign the object to the slot named by the string.
  */
  assignSlot(name, obj) {
    this.slots[name] = obj;
  }

  /*
  makeParent — given an object and a string, if the slot named by the string exists,
  */
  makeParent(name) {
    if (this.slots[name]) {
      this.parents.add(name);
    }
  }

  /*
  assignParentSlot — given an object, a string, and an object,
  makes that slot a parent.
  */
  assignParentSlot(name, obj) {
    this.assignSlot(name, obj);
    this.makeParent(name);
  }

  /*
  print — return a string representation of the object.
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
