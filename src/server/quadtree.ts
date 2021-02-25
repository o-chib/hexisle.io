// Import Mapsize or something

export class Quadtree {

    // The ratio of child to parent width.  Higher numbers will push payload further down
    // into the tree.  The resulting quadtree will require more node testing but less object
    // testing.
    private SPLIT: number;
    private MAX_DEPTH: number;
    private topLevelNode: QuadtreeNode;
    private topLevelNodeBox: Rect;

    constructor() {
        this.SPLIT = 0.5; // originally(with overlapping) = 0.6;
        this.MAX_DEPTH = 8;
        this.topLevelNode = new QuadtreeNode();
        this.topLevelNodeBox = new Rect(0, 1000, 1000, 0);
    }

    public collides(obj: CollisionObject, box: Rect): boolean {
        if ((box.l <= obj.r && obj.l <= box.r) && (obj.b >= box.t && box.b >= obj.t)) {
            return true;
        } else {
            return false;
        }
    }

    public getTopLevelNode(): QuadtreeNode {
        return this.topLevelNode;
    }

    public insertIntoQuadtree(node: QuadtreeNode, nodebox: Rect, depth: number, obj: CollisionObject): void {
        const splitLeft: number = nodebox.l + this.SPLIT * (nodebox.r - nodebox.l);
        const splitRight: number = nodebox.r - this.SPLIT * (nodebox.r - nodebox.l);
        const splitBottom: number = nodebox.b + this.SPLIT * (nodebox.t - nodebox.b);
        const splitTop: number = nodebox.t - this.SPLIT * (nodebox.t - nodebox.b);

        // very first call from the game
        if (depth == 0) {
            node = this.topLevelNode;
            nodebox = this.topLevelNodeBox;
        }

        // if we're at our deepest level it must be in here
        if (depth > this.MAX_DEPTH) {
            this.topLevelNode.collisionObjects.push(obj);
            // console.log("inserting at depth", depth);
        
        // contained within UPPER LEFT
        } else if (obj.r < splitRight && obj.b > splitTop) {
            if (!node.kids[0]) node.kids[0] = new QuadtreeNode();
                nodebox = new Rect(nodebox.l, splitRight, splitBottom, nodebox.t);
                this.insertIntoQuadtree(node.kids[0], nodebox, depth + 1, obj);
        
        // contained within UPPER RIGHT
        } else if (obj.l > splitLeft && obj.b > splitTop) {
            if (!node.kids[1]) node.kids[1] = new QuadtreeNode();
                nodebox = new Rect(splitLeft, nodebox.r, splitBottom, nodebox.t);
                this.insertIntoQuadtree(node.kids[1], nodebox, depth + 1, obj)
        
        // contained within LOWER LEFT
        } else if (obj.r < splitRight && obj.t < splitBottom) {
            if (!node.kids[2]) node.kids[2] = new QuadtreeNode();
                nodebox = new Rect(nodebox.l, splitRight, nodebox.b, splitTop);
                this.insertIntoQuadtree(node.kids[2], nodebox, depth + 1, obj);
                
        // contained within LOWER RIGHT
        } else if (obj.l > splitLeft && obj.t < splitBottom) {
            if (!node.kids[3]) node.kids[3] = new QuadtreeNode();
                nodebox = new Rect(splitLeft, nodebox.r, nodebox.b, splitTop);
                this.insertIntoQuadtree(node.kids[3], nodebox, depth + 1, obj)
        
        // object is not wholly contained in any child node
        } else {
            this.topLevelNode.collisionObjects.push(obj);
            // console.log("inserting at depth", depth);
        }
    }

    public deleteFromQuadtree(node: QuadtreeNode, nodebox: Rect, depth: number, obj: CollisionObject): void {
        const splitLeft: number = nodebox.l + this.SPLIT * (nodebox.r - nodebox.l);
        const splitRight: number = nodebox.r - this.SPLIT * (nodebox.r - nodebox.l);
        const splitBottom: number = nodebox.b + this.SPLIT * (nodebox.t - nodebox.b);
        const splitTop: number = nodebox.t - this.SPLIT * (nodebox.t - nodebox.b);

        // very first call from the game
        if (depth == 0) {
            node = this.topLevelNode;
            nodebox = this.topLevelNodeBox;
        }

        // if we're at our deepest level it must be in here
        if (depth > this.MAX_DEPTH) {
            let index: number = this.topLevelNode.collisionObjects.findIndex(o => o.payload === obj.payload);
            this.topLevelNode.collisionObjects.splice(index, 1);
        
        // contained within UPPER LEFT
        } else if (obj.r < splitRight && obj.b > splitTop) {
            if (!node.kids[0]) node.kids[0] = new QuadtreeNode();
                nodebox = new Rect(nodebox.l, splitRight, splitBottom, nodebox.t);
                this.deleteFromQuadtree(node.kids[0], nodebox, depth + 1, obj);
        
        // contained within UPPER RIGHT
        } else if (obj.l > splitLeft && obj.b > splitTop) {
            if (!node.kids[1]) node.kids[1] = new QuadtreeNode();
                nodebox = new Rect(splitLeft, nodebox.r, splitBottom, nodebox.t);
                this.deleteFromQuadtree(node.kids[1], nodebox, depth + 1, obj)
        
        // contained within LOWER LEFT
        } else if (obj.r < splitRight && obj.t < splitBottom) {
            if (!node.kids[2]) node.kids[2] = new QuadtreeNode();
                nodebox = new Rect(nodebox.l, splitRight, nodebox.b, splitTop);
                this.deleteFromQuadtree(node.kids[2], nodebox, depth + 1, obj);
                
        // contained within LOWER RIGHT
        } else if (obj.l > splitLeft && obj.t < splitBottom) {
            if (!node.kids[3]) node.kids[3] = new QuadtreeNode();
                nodebox = new Rect(splitLeft, nodebox.r, nodebox.b, splitTop);
                this.deleteFromQuadtree(node.kids[3], nodebox, depth + 1, obj)
        
        // object is not wholly contained in any child node
        } else {
            let index: number = this.topLevelNode.collisionObjects.findIndex(o => o.payload === obj.payload);
            this.topLevelNode.collisionObjects.splice(index, 1);
            // console.log("deleting at depth", depth, "at index", index);
        }
    }

    public updateInQuadtree(node: QuadtreeNode, nodebox: Rect, depth: number, obj: CollisionObject): void {
        this.deleteFromQuadtree(node, nodebox, depth, obj);
        this.insertIntoQuadtree(node, nodebox, depth, obj);
    }


    public searchQuadtree(node: QuadtreeNode, nodebox: Rect, box: Rect, results: CollisionObject[]): void {
        const splitLeft: number = nodebox.l + this.SPLIT * (nodebox.r - nodebox.l);
        const splitRight: number = nodebox.r - this.SPLIT * (nodebox.r - nodebox.l);
        const splitBottom: number = nodebox.l + this.SPLIT * (nodebox.r - nodebox.l);
        const splitTop: number = nodebox.r - this.SPLIT * (nodebox.r - nodebox.l);

        // function returns true if the two rectangles overlap.
        const testRect = (obj, box) => 
            (box.l < obj.r && obj.l < box.r && obj.b < box.t && box.b < obj.t);

        // console.log("searching quadtree");
        // console.log("   nodebox", nodebox.l, nodebox.r, nodebox.t, nodebox.b);
        // console.log("   box", box.l, box.r, box.t, box.b);

        // find all collision objects local to the current node and push them onto the results
        // if their rectangles overlap.
        node.collisionObjects
            .filter(obj => this.collides(obj, box))
            .map(obj => {
                results.push(obj);
            });

        // intersects UPPER LEFT
        if (box.l < splitRight && box.t > splitBottom && node.kids[0]) {
            const subbox = new Rect(nodebox.l, splitRight, splitBottom, nodebox.t);
            this.searchQuadtree(node.kids[0], subbox, box, results);
        
        // intersects UPPER RIGHT
        } if (box.r > splitLeft && box.t > splitBottom && node.kids[1]) {
            const subbox = new Rect(splitLeft, nodebox.r, splitBottom, nodebox.t);
            this.searchQuadtree(node.kids[1], subbox, box, results);
        
        // intersects LOWER LEFT
        } if (box.l < splitRight && box.b < splitTop && node.kids[2]) {
            const subbox = new Rect(nodebox.l, splitRight, nodebox.b, splitTop);
            this.searchQuadtree(node.kids[2], subbox, box, results);
        
        // intersects LOWER RIGHT
        } if (box.r > splitLeft && box.b < splitTop && node.kids[3]) {
            const subbox = new Rect(splitLeft, nodebox.r, nodebox.b, splitTop);
            this.searchQuadtree(node.kids[3], subbox, box, results);
        }
    }
}

export class Rect {
    public l: number;
    public r: number;
    public b: number;
    public t: number;

    constructor(l: number, r: number, b: number, t: number) {
        this.l = l;
        this.r = r;
        this.b = b;
        this.t = t;
    }
}

export class QuadtreeNode {
    public collisionObjects: CollisionObject[];
    public kids: QuadtreeNode[]; //ul,ur,ll,lr

    constructor() {
        this.collisionObjects = [];
        this.kids = [];
    }
}

export class CollisionObject extends Rect {
    public payload: any;
    
    constructor(l, r, b, t, payload) {
        super(l, r, b, t);
        this.payload = payload;
    }
}
