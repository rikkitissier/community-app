class DOM {

	static isTag(type) {
		const tags = { tag: true, script: true, style: true };
		return tags[type] || false;
	}

	isLastChild(node) {
		let elems = [];
		const checkNode = (elem) => {
			if( elem.next ){
				if( DOM.isTag(elem.next.type) ){
					elems.push( elem.next );
				}
				checkNode( elem.next );
			}
		}

		checkNode(node);
		return !elems.length;
	}
}

let dom = new DOM();
export default dom;