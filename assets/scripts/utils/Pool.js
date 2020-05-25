
class Pool {
    constructor(prefab, component = null, initCount = 0) {
        this._prefab = prefab;
        this._pool = new cc.NodePool(component);
        this._initCount = initCount;
        if (this._initCount) {
            for (let i = 0; i < _initCount; ++i) {
                let ob = cc.instantiate(this._prefab); // 创建节点
                this._pool.put(ob); // 通过 putInPool 接口放入对象池
            }
        }
    }
    push(ob) {
        this._pool.put(ob);//会调用component 的unuse
    }
    clear(){
        this._pool.clear();
    }
    pop() {
        var ob = null;
        if (this._pool.size() > 0) {
            ob = this._pool.get();//会调用component 的reuse
        } else { // 如果没有空闲对象，也就是对象池中备用对象不够时，我们就用 cc.instantiate 重新创建
            ob = cc.instantiate(this._prefab);
            // this._pool.put(ob);
            // ob = this._pool.get();
        }
        return ob;
    }
}
module.exports = Pool