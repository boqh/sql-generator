<template>
  <div class="sql-generate">
    <div class="header">
      <h2>SQL 生成器</h2>
      <div class="button-group">
        <a-dropdown>
          <a-button class="mr-2">
            <template #icon><folder-outlined /></template>
            示例
            <down-outlined />
          </a-button>
          <template #overlay>
            <a-menu @click="handleExampleSelect">
              <template v-if="savedExamples.length">
                <a-menu-item
                  v-for="example in savedExamples"
                  :key="example.sql_name"
                >
                  {{ example.sql_name }}
                </a-menu-item>
              </template>
              <template v-else>
                <a-menu-item key="heightDiff"> 学生身高差查询 </a-menu-item>
              </template>
            </a-menu>
          </template>
        </a-dropdown>

        <a-button type="primary" class="mr-2" @click="generateSQL">
          <template #icon><code-outlined /></template>
          生成
        </a-button>
        <a-button danger @click="showSaveModal">
          <template #icon><save-outlined /></template>
          保存
        </a-button>
      </div>
    </div>

    <div class="editor-container">
      <div class="editor-panel">
        <div class="panel-header">
          <span>输入 JSON</span>
          <div class="panel-actions">
            <a-tooltip title="格式化">
              <format-painter-outlined
                class="action-icon"
                @click="formatJSON"
              />
            </a-tooltip>
          </div>
        </div>
        <MonacoEditor
          v-model:value="inputValue"
          language="json"
          :style="{ height: '600px' }"
          theme="vs-dark"
          :options="{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 2,
          }"
        />
      </div>

      <div class="editor-panel">
        <div class="panel-header">
          <span>生成的 SQL</span>
          <div class="panel-actions">
            <a-tooltip title="复制">
              <copy-outlined
                v-if="outputValue"
                class="action-icon"
                @click="copySQL"
              />
            </a-tooltip>
          </div>
        </div>
        <MonacoEditor
          v-model:value="outputValue"
          language="sql"
          :read-only="true"
          theme="vs-dark"
          :style="{ height: '600px' }"
          :options="{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            readOnly: true,
          }"
        />
      </div>
    </div>

    <!-- 保存对话框 -->
    <a-modal
      v-model:visible="saveModalVisible"
      title="保存 SQL"
      :confirm-loading="saving"
      :mask-closable="false"
      destroy-on-close
      @ok="handleSave"
    >
      <a-form
        ref="formRef"
        :model="saveForm"
        :rules="rules"
        @finish="handleSave"
      >
        <a-form-item
          label="SQL名称"
          name="sqlName"
          :rules="[
            { required: true, message: '请输入SQL名称' },
            { min: 2, max: 50, message: 'SQL名称长度应在2-50个字符之间' },
          ]"
        >
<!--          <a-input-->
<!--            v-model:value="saveForm.sqlName"-->
<!--            placeholder="请输入SQL名称"-->
<!--            :max-length="50"-->
<!--            show-count-->
<!--            @pressEnter="handleSave"-->
<!--          />-->
          <a-input
              v-model:value="saveForm.sqlName"
              placeholder="请输入SQL名称"
              :max-length="50"
              @pressEnter="handleSave"
          />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="saveForm.description"
            placeholder="请输入SQL描述（选填）"
            :max-length="200"
            show-count
            :rows="4"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from "vue";
import { message, Form } from "ant-design-vue";
import type { FormInstance } from "ant-design-vue";
import MonacoEditor from "@/components/MonacoEditor.vue";
import debounce from "lodash/debounce";
import {
  FormatPainterOutlined,
  CodeOutlined,
  SaveOutlined,
  FolderOutlined,
  DownOutlined,
  CopyOutlined,
} from "@ant-design/icons-vue";
import {
  generateSQL as genSQL,
  saveSQL,
  getSQLNames,
  getSavedExamples,
} from "@/api/sql";


const rules = ref({ // 定义你的校验规则
  sqlName: [{ required: true, message: '请输入SQL名称' },
    { min: 2, max: 50, message: 'SQL名称长度应在2-50个字符之间' }],
  description: [] // 如果需要，为 description 添加校验规则
});

// 默认示例
const defaultExample = {
  main: "select @身高差() from (@学生表(id = 1)) s1, (@学生表(id = 2)) s2",
  身高差: "(s1.height - s2.height) as 身高差",
  学生表: "select * from student where id = #{id}",
};

interface SqlExample {
  sql_name: string;
  sql_parameters: string;
}

// 状态定义
const inputValue = ref("");
const outputValue = ref("");
const saveModalVisible = ref(false);
const saving = ref(false);
const savedExamples = ref<SqlExample[]>([]);
const formRef = ref<FormInstance>();

const saveForm = reactive({
  sqlName: "",
  sqlParameters: "",
  description: "",
});

interface SqlExample {
  sql_name: string;
  sql_parameters: string;
}

// 初始化
onMounted(async () => {
  try {
    // 获取保存的示例
    const response = await getSavedExamples();
    if (response.data.code === 200 && Array.isArray(response.data.data) && response.data.data.length > 0) {
      savedExamples.value = response.data.data.map((item: any) => ({ // 映射数据
        sql_name: item.sql_name,
        sql_parameters: item.sql_parameters,
      }));
      console.log("11111=", savedExamples.value[0].sql_parameters);
      // 加载第一个保存的示例
      inputValue.value = savedExamples.value[0].sql_parameters;
    } else {
      // 如果没有保存的示例，使用默认示例
      inputValue.value = JSON.stringify(defaultExample, null, 2);
    }
  } catch (error) {
    message.error("加载示例失败");
    inputValue.value = JSON.stringify(defaultExample, null, 2);
  }
});

// 处理示例选择
const handleExampleSelect = async ({ key }: { key: string }) => {
  const example = savedExamples.value.find((e) => e.sql_name === key);
  if (example) {
    try {
      // 确保 JSON 格式正确
      const parsed = JSON.parse(example.sql_parameters);
      inputValue.value = JSON.stringify(parsed, null, 2);
      message.success("示例已加载");
    } catch {
      message.error("示例格式错误");
    }
  }
};

// 使用 debounce 优化格式化操作
const formatJSON = debounce(() => {
  try {
    const parsed = JSON.parse(inputValue.value);
    inputValue.value = JSON.stringify(parsed, null, 2);
    message.success("JSON格式化成功");
  } catch (error) {
    message.error("无效的JSON格式");
  }
}, 300);

// 生成 SQL
const generateSQL = async () => {
  try {
    const jsonData = JSON.parse(inputValue.value);
    const loading = message.loading("正在生成SQL...", 0);

    const response = await genSQL(jsonData);
    loading();

    if (response.data.code === 200) {
      await nextTick();
      outputValue.value = response.data.data;
      message.success(response.data.message);
    } else {
      throw new Error(response.data.message || "SQL生成失败");
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      message.error("无效的 JSON 格式");
    } else {
      message.error("SQL生成失败：" + (error as Error).message);
    }
  }
};

// 显示保存对话框
const showSaveModal = () => {
  if (!outputValue.value) {
    message.warning("请先生成SQL");
    return;
  }
  saveModalVisible.value = true;
  nextTick(() => {
    formRef.value?.resetFields();
  });
};

// 处理保存
const handleSave = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    saving.value = true;

    const response = await saveSQL({
      sqlName: saveForm.sqlName,
      sqlParameters: inputValue.value,
      description: saveForm.description,
    });

    if (response.data.code === 200) {
      message.success("保存成功");
      saveModalVisible.value = false;
      // 重新加载示例列表
      const examplesResponse = await getSavedExamples();
      if (examplesResponse.data.code === 200 && Array.isArray(examplesResponse.data.data)) {
        savedExamples.value = examplesResponse.data.data.map((item: any) => ({
          sql_name: item.sql_name,
          sql_parameters: item.sql_parameters,
        }));
      }
    } else {
      throw new Error(response.data.message || "保存失败");
    }
  } catch (error) {
    if (error instanceof Error) {
      message.error(error.message);
    }
  } finally {
    saving.value = false;
  }
};

// 复制 SQL
const copySQL = async () => {
  try {
    await navigator.clipboard.writeText(outputValue.value);
    message.success("SQL已复制到剪贴板");
  } catch (error) {
    message.error("复制失败");
  }
};
</script>

<style scoped>
.sql-generate {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  gap: 8px;
}

.editor-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

.editor-panel {
  display: flex;
  flex-direction: column;
  border: 1px solid #1e1e1e;
  border-radius: 4px;
  background: #1e1e1e;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #2d2d2d;
  border-bottom: 1px solid #1e1e1e;
  color: #fff;
}

.panel-actions {
  display: flex;
  gap: 8px;
}

.action-icon {
  cursor: pointer;
  color: #fff;
  font-size: 16px;
  transition: color 0.3s;
}

.action-icon:hover {
  color: #1890ff;
}

:deep(.monaco-editor) {
  padding-top: 8px;
}

:deep(.ant-form-item-label > label) {
  color: rgba(0, 0, 0, 0.85);
}
</style>
