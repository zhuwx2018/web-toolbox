/**
 * 文本差异计算算法
 * 返回差异数组，每个元素包含:
 * - type: 'equal' | 'insert' | 'delete' | 'replace'
 * - replace 类型包含 oldValue, newValue, charDiff
 */
export function computeDiff(text1, text2) {
  const lines1 = text1.split('\n')
  const lines2 = text2.split('\n')

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

  // 后处理：将相邻的 delete+insert 合并为 replace（当它们相似时）
  return mergeToReplace(result)
}

/**
 * 计算两行之间的字符级差异
 */
export function computeLineDiff(oldLine, newLine) {
  if (oldLine === newLine) {
    return [{ type: 'equal', value: oldLine }]
  }

  const chars1 = oldLine.split('')
  const chars2 = newLine.split('')
  const m = chars1.length
  const n = chars2.length

  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (chars1[i - 1] === chars2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  const result = []
  let i = m, j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && chars1[i - 1] === chars2[j - 1]) {
      result.unshift({ type: 'equal', value: chars1[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'insert', value: chars2[j - 1] })
      j--
    } else if (i > 0) {
      result.unshift({ type: 'delete', value: chars1[i - 1] })
      i--
    } else {
      break
    }
  }

  return result
}

/**
 * 计算编辑距离
 */
function editDistance(s1, s2) {
  const m = s1.length
  const n = s2.length
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1
      }
    }
  }

  return dp[m][n]
}

/**
 * 判断两行是否相似（用于决定是否转为 replace）
 */
function isSimilar(line1, line2) {
  if (line1 === line2) return true
  if (!line1 || !line2) return false

  // 计算公共前缀长度
  let prefixLen = 0
  const minLen = Math.min(line1.length, line2.length)
  while (prefixLen < minLen && line1[prefixLen] === line2[prefixLen]) {
    prefixLen++
  }

  // 计算公共后缀长度
  let suffixLen = 0
  let i1 = line1.length - 1
  let i2 = line2.length - 1
  while (i1 >= prefixLen && i2 >= prefixLen && line1[i1] === line2[i2]) {
    suffixLen++
    i1--
    i2--
  }

  // 计算不同部分的长度
  const diffLen1 = line1.length - prefixLen - suffixLen
  const diffLen2 = line2.length - prefixLen - suffixLen

  // 如果不同部分很短，认为是相似行
  const maxLen = Math.max(line1.length, line2.length)
  if (maxLen === 0) return true

  // 只要公共前缀够长，就认为是相似行
  if (prefixLen >= maxLen * 0.5) {
    return true
  }

  return false
}

/**
 * 将相邻的 delete+insert 对合并为 replace
 */
function mergeToReplace(result) {
  const merged = []
  let i = 0

  while (i < result.length) {
    const curr = result[i]

    // 检查是否是 delete 后紧跟 insert
    if (curr.type === 'delete' && i + 1 < result.length && result[i + 1].type === 'insert') {
      const deleteItem = curr
      const insertItem = result[i + 1]

      if (isSimilar(deleteItem.value, insertItem.value)) {
        // 合并为 replace
        merged.push({
          type: 'replace',
          oldValue: deleteItem.value,
          newValue: insertItem.value,
          lineNum1: deleteItem.lineNum1,
          lineNum2: insertItem.lineNum2,
          charDiff: computeLineDiff(deleteItem.value, insertItem.value)
        })
        i += 2
        continue
      }
    }

    merged.push(curr)
    i++
  }

  return merged
}

/**
 * 找出所有差异位置的索引
 */
export function findDiffIndices(diffResult) {
  return diffResult
    .map((item, index) => ({ index, type: item.type }))
    .filter(item => item.type !== 'equal')
}
