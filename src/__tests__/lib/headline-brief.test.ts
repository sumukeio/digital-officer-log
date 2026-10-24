import {
  distillHeadlineMarkdown,
  stripMdMarks,
} from '@/lib/headline-brief/distill';
import {
  generateMergedMarkdown,
  generateModuleMarkdown,
  validateHeadlineBrief,
  hasBlockingErrors,
} from '@/lib/headline-brief/markdown';
import {
  buildProblemSkeletonFromMetrics,
  mergeSkeletonIntoModule,
} from '@/lib/headline-brief/metrics-skeleton';
import {
  buildPosterLayout,
  wrapText,
  wrapTextByWidth,
  approxMeasureText,
  toPosterChips,
  getPosterTheme,
  stripLeadingIndex,
  estimatePosterPageCount,
  estimatePosterHeight,
} from '@/lib/headline-brief/poster';
import { HEADLINE_BRIEF_LIMITS, createEmptyModule } from '@/lib/headline-brief/types';
import { AllWeeklyMetrics } from '@/lib/weekly-report/types';

const SAMPLE_LONG_TEXT = `
一、问题

**1. 智造三部 TJJ 烫印线异常最集中，约占六成**

- 本周生产头条异常中，智造三部 TJJ 烫印线约 **55 条，占 59.8%**，主要发生在工站 **12、14**。
- 高频问题：
  - **硅胶板损坏/更换**：涉及 TJJ-0902、0605、0702 等多条产线。
  - **偏印、多印、漏印、烫印不上**：TJJ-0308、TJJ-0306 等均有发生。
  - **换花纹、换模、换板调试**：TJJ-0211、TJJ-0605 等较频繁。
  - **上料/料架/机械手类**：TJJ-0705 等出现取料机械手异常。

**2. 注塑/机械手类异常集中在智造二部、智造五部**

- ZSJ 系列约 **27 条**，主要问题：
  - 机械手故障：ZSJ2009 机械手 Y 轴同步带破损；
  - 流道/热流道异常：ZSJ4009 洗流道；
  - 打不满、飞边、开裂：ZSJ4012 等。

---

## 二、改善措施

**1. 硅胶板管理要从事后更换转向事前预防**

- 建立硅胶板更换台账与寿命预警，记录每块板使用时长、更换原因、对应产线。
- 对新到硅胶板做入库检验。

**2. 烫印偏印、漏印要固化工艺参数**

- 换板、换花纹后必须做首件确认。

**3. 机械手和注塑周边要建立点检与备件计划**

- 对机械手 Y 轴同步带等易损件制定定期点检和更换计划。

**4. 换模和停机待料要加强生产协同**

- 换模、换花纹前提前确认模具、硅胶板、半成品配套情况。

---

## 三、收益

**1. 直接生产收益**

- 减少硅胶板反复更换和换板调试时间，可提高 TJJ 烫印线开机率。

**2. 质量收益**

- 通过首件确认和工艺参数固化，可降低烫印不良流入下工序的风险。

**3. 管理收益**

- 异常分类更加清晰，责任人明确，便于车间快速响应和绩效跟踪。

> 说明：当前数据中未提供停机时长、不良数量、返工工时、损失金额等量化字段，因此收益暂以定性为主。
`;

describe('headline-brief 核心库', () => {
  describe('distillHeadlineMarkdown', () => {
    it('应从样例长文提炼出问题/改善/收益并遵守硬约束', () => {
      const mod = distillHeadlineMarkdown(SAMPLE_LONG_TEXT, {
        moduleKey: 'production',
      });

      expect(mod.moduleTitle).toBe('生产头条');
      expect(mod.problems.length).toBeGreaterThanOrEqual(1);
      expect(mod.problems.length).toBeLessThanOrEqual(HEADLINE_BRIEF_LIMITS.maxProblems);
      expect(mod.problems[0].title).toMatch(/TJJ|烫印/);
      expect(mod.problems[0].evidence.length).toBeLessThanOrEqual(
        HEADLINE_BRIEF_LIMITS.maxEvidencePerProblem
      );
      expect(mod.actions.length).toBeGreaterThanOrEqual(1);
      expect(mod.actions.length).toBeLessThanOrEqual(HEADLINE_BRIEF_LIMITS.maxActions);
      expect(mod.benefits.production).toMatch(/开机率|硅胶板/);
      expect(mod.benefits.quality).toBeTruthy();
      expect(mod.benefits.management).toBeTruthy();
      expect(mod.quantified).toBe(false);
      expect(mod.note).toMatch(/定性|量化/);
    });

    it('应剥离 Markdown 标记', () => {
      expect(stripMdMarks('**硅胶板**')).toBe('硅胶板');
    });

    it('空文本应返回空模块', () => {
      const mod = distillHeadlineMarkdown('');
      expect(mod.problems).toEqual([]);
      expect(mod.actions).toEqual([]);
    });

    it('QC 并列收益 bullet（无生产/质量/管理小标题）也应填入三类收益', () => {
      const qcText = `
## 一、问题

**1. 物料/型号/辅料用错类：5条**
- 杯子用错：装箱二组已返工。

**2. 成型质量不良类：8条**
- 拉裂：不良率20%。

## 二、改善

1. **用错/混料类**：
- 上线前执行首件复核。

## 三、收益

- **降低返工/挑选成本**：不良率20%~50%，源头改善可减少返工挑选人力。
- **减少混料客诉/批量退货**：混料若流出客户易造成投诉；首件复核可拦截在厂内。
- **提升直通率和交付及时性**：缺胶、拉裂会导致返修停机，改善后提高直通率。
- **降低供应商后段返工成本**：色差、条码问题前移到来料检验。
`;
      const mod = distillHeadlineMarkdown(qcText, { moduleKey: 'qc' });
      expect(mod.benefits.production).toMatch(/返工|挑选|直通/);
      expect(mod.benefits.quality).toMatch(/客诉|退货|混料/);
      expect(mod.benefits.management).toMatch(/供应商|来料检验/);
    });
  });

  describe('markdown 生成与校验', () => {
    it('应生成含三节结构的企微 Markdown 且长度可控', () => {
      const mod = distillHeadlineMarkdown(SAMPLE_LONG_TEXT, {
        moduleKey: 'production',
      });
      const md = generateModuleMarkdown(mod, '9.8-9.14', 37);
      expect(md).toContain('问题—改善—收益');
      expect(md).toContain('**一、问题**');
      expect(md).toContain('**二、改善**');
      expect(md).toContain('**三、收益**');
      expect(md.length).toBeLessThanOrEqual(HEADLINE_BRIEF_LIMITS.maxMarkdownChars);

      const merged = generateMergedMarkdown({
        year: 2026,
        weekNumber: 37,
        titleFormatted: '9.8-9.14',
        modules: [mod, { ...mod, moduleKey: 'qc', moduleTitle: 'QC头条' }],
      });
      expect(merged).toContain('QC头条');
      expect(merged).toContain('---');
    });

    it('超条数应产生 error 级校验', () => {
      const mod = createEmptyModule('production');
      mod.problems = [
        { title: 'a', evidence: [] },
        { title: 'b', evidence: [] },
        { title: 'c', evidence: [] },
        { title: 'd', evidence: [] },
      ];
      const issues = validateHeadlineBrief([mod]);
      expect(hasBlockingErrors(issues)).toBe(true);
    });
  });

  describe('metrics skeleton', () => {
    it('应从生产指标生成问题骨架', () => {
      const metrics: AllWeeklyMetrics = {
        production: {
          totalCards: 92,
          over24Count: 5,
          over48Count: 2,
          over48Details: [],
          workshopStats: [
            { workshop: '智造三部', shortName: '三部', count: 55, percentage: 59.8 },
            { workshop: '智造二部', shortName: '二部', count: 20, percentage: 21.7 },
          ],
        },
      };
      const sk = buildProblemSkeletonFromMetrics(metrics, 'production');
      expect(sk.problems[0].title).toMatch(/智造三部/);
      expect(sk.problems[0].title).toMatch(/59\.8%/);
      expect(sk.quantified).toBe(true);

      const existing = createEmptyModule('production');
      existing.actions = ['已有改善'];
      const merged = mergeSkeletonIntoModule(existing, sk);
      expect(merged.problems.length).toBeGreaterThan(0);
      expect(merged.actions).toEqual(['已有改善']);
    });
  });

  describe('poster layout', () => {
    it('wrapText 应按字数折行（兼容）', () => {
      expect(wrapText('abcdefghij', 4)).toEqual(['abcd', 'efgh', 'ij']);
    });

    it('A1：测宽折行应尽量一行写完，不满宽不早断', () => {
      const title = '智造三部 TJJ 烫印线异常最集中，约占六成';
      const wide = wrapTextByWidth(title, 800, (s) => approxMeasureText(s, 26));
      expect(wide).toEqual([title]);

      const narrow = wrapTextByWidth(title, 200, (s) => approxMeasureText(s, 26));
      expect(narrow.length).toBeGreaterThan(1);
      expect(narrow.join('')).toBe(title);
      // 不应在「最集」处硬切丢「中」：拼接完整
      expect(narrow.join('')).toContain('最集中');
    });

    it('应去掉标题前导序号，避免 1. 1.', () => {
      expect(stripLeadingIndex('1. 智造三部 TJJ')).toBe('智造三部 TJJ');
      expect(stripLeadingIndex('2、注塑异常')).toBe('注塑异常');
    });

    it('B1：单模块永远 1 页，高度随内容增高', () => {
      const mod = distillHeadlineMarkdown(SAMPLE_LONG_TEXT);
      expect(estimatePosterPageCount(mod)).toBe(1);
      const h = estimatePosterHeight(mod, '9.7-9.13', 37);
      expect(h).toBeGreaterThanOrEqual(1600);
    });

    it('应生成至少一页海报布局摘要且含问题分区', () => {
      const mod = distillHeadlineMarkdown(SAMPLE_LONG_TEXT);
      const pages = buildPosterLayout(mod, '9.8-9.14', 37, 2);
      expect(pages.length).toBe(1);
      expect(pages[0].lines.some((l) => l.text.includes('问题'))).toBe(true);
      // 摘要行不应出现双编号
      const problemLine = pages[0].lines.find((l) => /^\d+\./.test(l.text));
      expect(problemLine?.text).not.toMatch(/^\d+\.\s*\d+\./);
    });

    it('证据应压缩为短芯片标签', () => {
      const chips = toPosterChips(
        ['硅胶板损坏/更换：涉及很多机台流水账说明文字', '偏印、多印、漏印'],
        4
      );
      expect(chips.length).toBe(2);
      expect(chips[0].length).toBeLessThanOrEqual(15);
    });

    it('生产/QC 主题色应区分', () => {
      expect(getPosterTheme('production').accent).toBe('#0F766E');
      expect(getPosterTheme('qc').accent).toBe('#1D4ED8');
    });
  });
});
