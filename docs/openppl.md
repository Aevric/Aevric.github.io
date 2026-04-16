# 大模型底层算子完整总结表

## 激活函数类
| 算子 | 公式 | 功能 & 计算过程 |
|------|------|----------------|
| Swish | $\text{swish}(x) = x \cdot \text{sigmoid}(\beta x)$ | 带可学习参数 $\beta$ 的平滑激活，单路输入，引入非线性 |
| SiLU | $\text{silu}(x) = x \cdot \text{sigmoid}(x)$ | 固定 $\beta=1$ 的 Swish，无额外参数 |
| SwiGLU | $\text{SwiGLU}(x) = x_2 \cdot \text{Swish}(x_1)$ | 门控激活：输入切两半，前半 Swish，再乘后半 |
| GELU | $\text{GELU}(x) = x\Phi(x)$ | 高斯误差平滑激活，早期 Transformer 常用 |
| GeGLU | $\text{GeGLU}(x) = x_2 \cdot \text{GELU}(x_1)$ | 切分输入，用 GELU 做门控 |
| ReLU | $\max(0, x)$ | 最基础整流激活，负半轴置 0 |
| LeakyReLU | $\max(\alpha x, x)$ | 带泄漏的 ReLU，缓解死神经元 |

## 归一化类
| 算子 | 公式 | 功能 |
|------|------|------|
| LayerNorm | $y=\frac{x-E[x]}{\sqrt{\text{Var}[x]+\epsilon}}\gamma+\beta$ | 对单个样本特征归一化 |
| RMSNorm | $y=\frac{x}{\sqrt{E[x^2]+\epsilon}}\gamma$ | LLM 标配，无均值、无偏置 |
| SkipRMSNorm | $z=x+skip\_in,\ y=\text{RMSNorm}(z)$ | 残差连接 + RMSNorm |
| BatchNorm | - | 按批次归一化，CNN 常用 |
| GroupNorm | - | 按通道分组归一化，小 batch 更稳 |
| InstanceNorm | - | 单样本单通道归一化，生成模型常用 |

## 概率与正则
| 算子 | 功能 |
|------|------|
| Softmax | 将向量转为和为 1 的概率分布 |
| LogSoftmax | Softmax 后取对数，损失计算更稳定 |
| Dropout | 训练时随机置零，防止过拟合 |

## 张量基础操作
| 算子 | 功能 |
|------|------|
| Linear | 基础线性变换 $y=xW^T+b$ |
| Pad | 张量边缘填充（通常补 0），对齐形状 |
| Reshape | 不改变元素总数，重塑维度排布 |

## 嵌入与位置编码
| 算子 | 功能 |
|------|------|
| RotaryPositionEmbedding (RoPE) | 旋转位置编码，对 Q/K 按位置旋转 |
| ParallelEmbedding | 多卡张量并行词嵌入 |
| VisionEmbedding | ViT 图像嵌入：切块 + CLS + 位置编码 |

## 视觉算子
| 算子 | 功能 |
|------|------|
| PixelUnshuffle | 图像空间下采样，通道升维 |

## 注意力相关
| 算子 | 功能 |
|------|------|
| MultiHeadAttention | 多头自注意力，Transformer 核心 |
| MultiHeadCacheAttention | 带 KV Cache 的加速推理注意力 |
| KeyValueCache | 缓存历史 KV，加速生成 |

## 张量并行线性层
| 算子 | 功能 |
|------|------|
| ColumnParallelLinear | 列并行线性，沿输出维度切分，无 all-reduce |
| RowParallelLinear | 行并行线性，沿输入维度切分，需 all-reduce 求和 |

## MoE 混合专家
| 算子 | 功能 |
|------|------|
| MoeSelect | 为 token 选择 top-k 专家，重排顺序 |
| MoeReduce | 聚合多专家结果，恢复 token 顺序 |
| MoeColumnParallelLinear | MoE 专用列并行线性 |
| MoeRowParallelLinear | MoE 专用行并行线性 |

## 权重仅量化（WOQU）
| 算子 | 功能 |
|------|------|
| WoquColumnParallelLinear | 权重仅量化 + 列并行线性，推理加速 |
| WoquRowParallelLinear | 权重仅量化 + 行并行线性，省显存 |
