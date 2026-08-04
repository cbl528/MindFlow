package com.caobolun.business.core.chunk.blockaware;

import com.caobolun.business.core.parse.model.HeadingBlock;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * 标题处理器：不产 VectorChunk，只更新 ChunkerNode 主流程持有的 outlinePath
 * <p>
 * 语义：H_N 标题会保留前 N-1 级 path，并把自己作为第 N 级追加
 * <ul>
 *   <li>H1 "A" → ["A"]</li>
 *   <li>... 再来 H2 "B" → ["A", "B"]</li>
 *   <li>... 再来 H2 "C" → ["A", "C"]（同级替换）</li>
 *   <li>... 再来 H1 "D" → ["D"]（顶级重置）</li>
 *   <li>... 再来 H3 "E" → ["D", "E"]（跳级时只用当前 path 补齐）</li>
 * </ul>
 */
@Component
public class HeadingHandler {

    /**
     * 根据 heading 更新章节路径。
     *
     * @param currentPath 当前 outlinePath（不可变）
     * @param heading     新的 HeadingBlock
     * @return 新的 outlinePath（不可变）
     */
    public List<String> update(List<String> currentPath, HeadingBlock heading) {
        if (heading == null) {
            return currentPath;
        }
        int targetLevel = Math.max(1, heading.level());
        int keep = Math.min(currentPath.size(), targetLevel - 1);

        List<String> next = new ArrayList<>(keep + 1);
        for (int i = 0; i < keep; i++) {
            next.add(currentPath.get(i));
        }
        next.add(heading.text() == null ? "" : heading.text());
        return List.copyOf(next);
    }
}
