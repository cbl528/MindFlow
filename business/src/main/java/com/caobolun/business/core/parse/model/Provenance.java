package com.caobolun.business.core.parse.model;

/**
 * Block 来源信息(溯源用)
 * <p>
 * 用于检索时拼接 sectionContext、排障时定位原始文档位置
 *
 * @param sourceFile 原始文件标识(文件 ID 或文件名)
 * @param sheetName  Excel sheet 名,非 Excel 来源为 null
 */
public record Provenance(String sourceFile, String sheetName) {

    /**
     * 仅含文件来源的最小构造
     */
    public static Provenance ofFile(String sourceFile) {
        return new Provenance(sourceFile, null);
    }

    /**
     * Excel 来源构造
     */
    public static Provenance ofExcelCell(String sourceFile, String sheetName) {
        return new Provenance(sourceFile, sheetName);
    }
}
