<template>
  <div ref="editorContainer" class="monaco-editor-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as monaco from 'monaco-editor';

const props = defineProps<{
  value: string;
  language: string;
  theme?: string;
  readOnly?: boolean;
}>();

const emit = defineEmits<{
  'update:value': [value: string];
}>();

const editorContainer = ref<HTMLElement>();
let editor: monaco.editor.IStandaloneCodeEditor;

onMounted(() => {
  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: props.value,
      language: props.language,
      theme: props.theme || 'vs-dark',
      automaticLayout: true,
      minimap: { enabled: false },
      readOnly: props.readOnly,
      scrollBeyondLastLine: false,
      fontSize: 14,
      tabSize: 2,
    });

    editor.onDidChangeModelContent(() => {
      emit('update:value', editor.getValue());
    });
  }
});

watch(() => props.value, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue);
  }
});

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
  }
});
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
}
</style>