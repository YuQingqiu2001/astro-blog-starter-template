import type { Journal } from "../lib/types";

export const journals: Journal[] = [
	{
		id: 1,
		name: "玄学前沿",
		nameEn: "Frontiers in Metaphysics",
		slug: "frontiers-metaphysics",
		description:
			"致力于发表最抽象、最深刻的研究成果，为全球研究人员提供最优质的摸鱼素材。本刊无差别接受来自各领域的玄学研究，只要足够抽象，我们就愿意发表。",
		impactFactor: 999.9,
		issn: "0000-0001",
		isMain: true,
		color: "#C62828",
		field: "综合",
	},
	{
		id: 2,
		name: "无用科学年刊",
		nameEn: "Annals of Unnecessary Science",
		slug: "annals-unnecessary-science",
		description:
			"专注于发表那些绝对没有实际应用价值的科学研究。我们坚信，知识本身就是目的，尤其是那些永远不会有用的知识。",
		impactFactor: 42.0,
		issn: "0000-0002",
		isMain: false,
		color: "#6A1B9A",
		field: "自然科学",
	},
	{
		id: 3,
		name: "显见发现学报",
		nameEn: "Journal of Obvious Discoveries",
		slug: "journal-obvious-discoveries",
		description:
			"我们发表那些一眼就能看出结论但需要大量数据支撑的研究。科学界需要更多\u300c水是湿的\u300d类型的严谨论证。",
		impactFactor: 31.4,
		issn: "0000-0003",
		isMain: false,
		color: "#1565C0",
		field: "社会科学",
	},
	{
		id: 4,
		name: "应用荒谬学评论",
		nameEn: "Reviews in Applied Absurdity",
		slug: "reviews-applied-absurdity",
		description:
			"汇集了将荒谬理论应用于实际问题的跨界研究。我们相信，每一个荒谬的想法，都有其在现实中的对应物。",
		impactFactor: 88.8,
		issn: "0000-0004",
		isMain: false,
		color: "#2E7D32",
		field: "交叉学科",
	},
	{
		id: 5,
		name: "理论废话快报",
		nameEn: "Letters in Theoretical Nonsense",
		slug: "letters-theoretical-nonsense",
		description:
			"快速发表短篇废话型理论研究。字数少，废话多，逻辑不必自洽，但引用必须齐全。",
		impactFactor: 15.2,
		issn: "0000-0005",
		isMain: false,
		color: "#E65100",
		field: "理论研究",
	},
	{
		id: 6,
		name: "量化玄学季刊",
		nameEn: "Quarterly Journal of Quantitative Metaphysics",
		slug: "quantitative-metaphysics",
		description:
			"用数学和统计学方法研究玄学问题。我们尤其欢迎那些公式复杂但结论荒谬的投稿。",
		impactFactor: 56.7,
		issn: "0000-0006",
		isMain: false,
		color: "#00838F",
		field: "数理方法",
	},
];

export const mainJournal = journals.find((j) => j.isMain)!;
export const subJournals = journals.filter((j) => !j.isMain);

export function getJournalBySlug(slug: string): Journal | undefined {
	return journals.find((j) => j.slug === slug);
}

export function getJournalById(id: number): Journal | undefined {
	return journals.find((j) => j.id === id);
}

// Sample featured research for homepage module 1
export const featuredResearch = [
	{
		title: "咖啡因与科研生产力的非线性关系：一个五维模型",
		journal: "玄学前沿",
		journalSlug: "frontiers-metaphysics",
		authors: "周建国, 钱咖啡",
		excerpt:
			"本研究构建了一个涵盖时间、精力、焦虑感、膀胱压力和哲学深度的五维模型，揭示了摄入第4.7杯咖啡后科研创新力的突然崩塌现象。",
		date: "2024-12-15",
		doi: "10.0000/FIM.2024.999",
	},
	{
		title: "开会时假装记笔记的最优鼠标移动策略",
		journal: "应用荒谬学评论",
		journalSlug: "reviews-applied-absurdity",
		authors: "李装模作样, 赵敷衍了事",
		excerpt:
			"通过眼动追踪实验，我们发现每分钟进行3.2次随机鼠标点击可以最大限度地提升旁观者对\u300c工作状态\u300d的主观评估，同时将实际注意力需求降至最低。",
		date: "2025-01-03",
		doi: "10.0000/RAA.2025.007",
	},
	{
		title: "论文致谢部分字数与最终成绩的正相关性：跨学科元分析",
		journal: "显见发现学报",
		journalSlug: "journal-obvious-discoveries",
		authors: "王感谢, 孙导师大人",
		excerpt:
			"通过对1247篇学位论文的分析，我们发现：每多感谢一位不相关人士，成绩提升0.03分；而多提一次导师的名字，则可提升0.17分（p<0.0001）。",
		date: "2025-01-20",
		doi: "10.0000/JOD.2025.042",
	},
];
