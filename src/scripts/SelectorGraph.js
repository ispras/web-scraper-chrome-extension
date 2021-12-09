export default class SelectorGraph {
	constructor(sitemap) {
		this.sitemap = sitemap;
		this.nodes = [];
		this.nodes.push({ id: '_root', parentSelectors: [] });
		sitemap.selectors.forEach(
			function (selector) {
				this.nodes.push(JSON.parse(JSON.stringify(selector)));
			}.bind(this)
		);
	}

	getNodes() {
		return this.nodes;
	}

	getLabelAnchors() {
		const labelAnchors = [];
		this.nodes.forEach(function (node) {
			labelAnchors.push({ node });
			labelAnchors.push({ node });
		});
		return labelAnchors;
	}

	getLabelAnchorLinks() {
		const labelAnchorLinks = [];
		for (let i = 0; i < this.nodes.length; i++) {
			labelAnchorLinks.push({
				source: i * 2,
				target: i * 2 + 1,
				weight: 1,
			});
		}
		return labelAnchorLinks;
	}

	getNodeById(nodeId) {
		for (const i in this.nodes) {
			const node = this.nodes[i];
			if (node.id === nodeId) {
				return node;
			}
		}
	}

	getLinks() {
		const links = [];
		this.nodes.forEach(
			function (selector) {
				selector.parentSelectors.forEach(
					function (parentSelectorId) {
						const parentSelector = this.getNodeById(parentSelectorId);
						links.push({
							source: selector,
							target: parentSelector,
							weight: 1,
						});
					}.bind(this)
				);
			}.bind(this)
		);
		return links;
	}

	draw(element, w, h) {
		const labelDistance = 0;

		const vis = d3.select(element).append('svg:svg').attr('width', w).attr('height', h);

		const nodes = this.getNodes();
		const labelAnchors = this.getLabelAnchors();
		const labelAnchorLinks = this.getLabelAnchorLinks();
		const links = this.getLinks();

		const force = d3.layout
			.force()
			.size([w, h])
			.nodes(nodes)
			.links(links)
			.gravity(1)
			.linkDistance(50)
			.charge(-3000)
			.linkStrength(function (x) {
				return x.weight * 10;
			});

		force.start();

		const force2 = d3.layout
			.force()
			.nodes(labelAnchors)
			.links(labelAnchorLinks)
			.gravity(0)
			.linkDistance(0)
			.linkStrength(8)
			.charge(-100)
			.size([w, h]);
		force2.start();

		const link = vis
			.selectAll('line.link')
			.data(links)
			.enter()
			.append('svg:line')
			.attr('class', 'link')
			.style('stroke', '#CCC');

		const node = vis
			.selectAll('g.node')
			.data(force.nodes())
			.enter()
			.append('svg:g')
			.attr('class', 'node');
		node.append('svg:circle')
			.attr('r', 5)
			.style('fill', '#555')
			.style('stroke', '#FFF')
			.style('stroke-width', 3);
		node.call(force.drag);

		const anchorLink = vis.selectAll('line.anchorLink').data(labelAnchorLinks); // .enter().append("svg:line").attr("class", "anchorLink").style("stroke", "#999");

		const anchorNode = vis
			.selectAll('g.anchorNode')
			.data(force2.nodes())
			.enter()
			.append('svg:g')
			.attr('class', 'anchorNode');
		anchorNode.append('svg:circle').attr('r', 0).style('fill', '#FFF');
		anchorNode
			.append('svg:text')
			.text(function (d, i) {
				return i % 2 == 0 ? '' : d.node.id;
			})
			.style('fill', '#555')
			.style('font-family', 'Arial')
			.style('font-size', 12);

		const updateLink = function () {
			this.attr('x1', function (d) {
				return d.source.x;
			})
				.attr('y1', function (d) {
					return d.source.y;
				})
				.attr('x2', function (d) {
					return d.target.x;
				})
				.attr('y2', function (d) {
					return d.target.y;
				});
		};

		const updateNode = function () {
			this.attr('transform', function (d) {
				return `translate(${d.x},${d.y})`;
			});
		};

		force.on('tick', function () {
			force2.start();

			node.call(updateNode);

			anchorNode.each(function (d, i) {
				if (i % 2 == 0) {
					d.x = d.node.x;
					d.y = d.node.y;
				} else {
					const b = this.childNodes[1].getBBox();

					const diffX = d.x - d.node.x;
					const diffY = d.y - d.node.y;

					const dist = Math.sqrt(diffX * diffX + diffY * diffY);

					let shiftX = (b.width * (diffX - dist)) / (dist * 2);
					shiftX = Math.max(-b.width, Math.min(0, shiftX));
					const shiftY = 5;
					this.childNodes[1].setAttribute('transform', `translate(${shiftX},${shiftY})`);
				}
			});

			anchorNode.call(updateNode);

			link.call(updateLink);
			anchorLink.call(updateLink);
		});
	}
}
