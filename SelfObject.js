/*
* Self object model written in JavaScript. 
*
*/

class SelfObject {
  constructor() {
    this.slots = {};        // name -> object
    this.parents = new Set(); // parent slot names
    this.messages = [];     // optional list of messages
    this.primitive = null;  // optional primitive value
    this.primitiveFn = null;// optional primitive function
  }

  // Copy the object
  copy() {
    const newObj = new SelfObject();
    newObj.slots = { ...this.slots };
    newObj.parents = new Set(this.parents);
    newObj.messages = [...this.messages];
    newObj.primitive = this.primitive;
    newObj.primitiveFn = this.primitiveFn;
    return newObj;
  }

  // Evaluate the object
  evaluate() {
    if (this.primitive !== null) {
      return this.copy(); // primitive data
    }
    if (this.primitiveFn !== null) {
      return this.primitiveFn(this.copy());
    }
    if (this.messages.length > 0) {
      const copy = this.copy();
      let result = copy;
      for (const msg of copy.messages) {
        result = copy.sendAMessage(msg);
      }
      return result;
    }
    return this; // default
  }

  // Send a message (lookup slot by name)
  sendAMessage(name, visited = new Set()) {
    if (this.slots[name]) {
      return this.slots[name].evaluate();
    }
    visited.add(this);
    for (const parentName of this.parents) {
      const parent = this.slots[parentName];
      if (parent && !visited.has(parent)) {
        const result = parent.sendAMessage(name, visited);
        if (result) return result;
      }
    }
    return null;
  }

  // Send a message with a parameter
  sendAMessageWithParameters(name, paramObj) {
    if (this.slots[name]) {
      const target = this.slots[name].copy();
      target.slots["parameter"] = paramObj;
      return target.evaluate();
    }
    for (const parentName of this.parents) {
      const parent = this.slots[parentName];
      const result = parent?.sendAMessageWithParameters(name, paramObj);
      if (result) return result;
    }
    return null;
  }

  // Assign slot
  assignSlot(name, obj) {
    this.slots[name] = obj;
  }

  // Make slot a parent
  makeParent(name) {
    if (this.slots[name]) {
      this.parents.add(name);
    }
  }

  // Assign and make parent
  assignParentSlot(name, obj) {
    this.assignSlot(name, obj);
    this.makeParent(name);
  }

  // Print representation
  print() {
    return JSON.stringify({
      slots: Object.keys(this.slots),
      parents: [...this.parents],
      primitive: this.primitive,
      hasMessages: this.messages.length > 0,
      hasPrimitiveFn: this.primitiveFn !== null
    }, null, 2);
  }
}

// Example usage
const numberObj = new SelfObject();
numberObj.primitive = 5;

const addOne = new SelfObject();
addOne.primitiveFn = (self) => {
  const param = self.slots["parameter"];
  const result = new SelfObject();
  result.primitive = param.primitive + 1;
  return result;
};

numberObj.assignSlot("increment", addOne);

const result = numberObj.sendAMessageWithParameters("increment", numberObj);
console.log("Result:", result.primitive); // 6

