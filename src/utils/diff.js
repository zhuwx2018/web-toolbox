/**
 * 简单的文本差异计算算法
 * 返回差异数组，每个元素包含 type: 'equal' | 'insert' | 'delete' 和 value
 */
export function computeDiff(text1, text2) {
  const lines1 = text1.split('\n')
  const lines2 = text2.split('\n')

  const diff = []
  const m = lines1.length
  const n = lines2.length

  // 使用动态规划计算 LCS
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (lines1[i - 1] === lines2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // 回溯构建差异
  let i = m, j = n
  const result = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
      result.unshift({ type: 'equal', value: lines1[i - 1], lineNum1: i, lineNum2: j })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'insert', value: lines2[j - 1], lineNum2: j })
      j--
    } else {
      result.unshift({ type: 'delete', value: lines1[i - 1], lineNum1: i })
      i--
    }
  }

  return result
}

/**
 * 找出所有差异位置的索引
 */
export function findDiffIndices(diffResult) {
  return diffResult
    .map((item, index) => ({ index, type: item.type }))
    .filter(item => item.type !== 'equal')
}
