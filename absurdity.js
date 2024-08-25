export class regconst {
    constructor(value) {
        this.value = value
        this.children = new Set()
    }
    update() {
        for (const child of this.children) {
            child.update()
        }
    }
    set_value(new_value) {
        this.value = new_value
        this.update()
    }
    dereg_child(child) { // invalidates child
        this.children.delete(child)
    }
    reg_child(partial_child) {
        this.children.add(partial_child)
    }
}

export class regeval {
    constructor(f, ...args) {
        this.f = f // function
        this.args = args // array of regevals
        this.value = f(...(args.map(x=>x.value)))
        this.children = new Set()
        for (const arg of args) {
            arg.reg_child(this)
        }
    }
    update() {
        this.value = this.f(...this.args.map(x=>x.value))
        for (const child of this.children) {
            child.update()
        }
    }
    replace(f, ...args) {
        this.f = f
        for (let i = 0; i < this.args.length; ++i) {
            this.detach_arg(i);
        }
        this.args = args
        for (const arg of args) {
            arg.reg_child(this)
        }
        this.update()
    }
    set_func(f) { // requires same argument arity
        this.f = f
        this.update()
    }
    detach_arg(i) { // invalidates node
        this.args[i].dereg_child(this);
    }
    set_arg(i, new_arg) {
        this.detach_arg(i);
        this.args[i] = new_arg
        this.args[i].reg_child(this)
        this.update()
    }
    dereg_child(child) { // invalidates child
        this.children.delete(child)
    }
    reg_child(partial_child) {
        this.children.add(partial_child)
    }
}

