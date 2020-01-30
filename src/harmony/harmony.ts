import Extension from './extension';
import ExtensionGraph from './extension-graph/extension-graph';
import { AnyExtension } from './types';
import { ExtensionLoadError } from './exceptions';

// TODO: refactor to generics
async function asyncForEach(array: any, callback: any) {
  // eslint-disable-next-line no-plusplus
  for (let index = 0; index < array.length; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await callback(array[index], index, array);
  }
}

export default class Harmony {
  constructor(
    /**
     * extension graph
     */
    private graph: ExtensionGraph
  ) {}

  get extensions() {
    // return this.graph.
  }

  async load(extensions: AnyExtension[]) {
    this.graph.addExtensions(extensions);
    asyncForEach(extensions, async ext => this.runOne(ext));
  }

  async runOne(extension: AnyExtension) {
    if (extension.instance) return;
    // create an index of all vertices in dependency graph
    const dependencies = await Promise.all(
      extension.dependencies.map(async (ext: AnyExtension) => {
        return ext.instance;
      })
    );

    try {
      await extension.run(dependencies, this);
    } catch (err) {
      throw new ExtensionLoadError(extension, err);
    }
  }

  /**
   * execute harmony.
   */
  async run() {
    const executionOrder = this.graph.byExecutionOrder();
    await asyncForEach(executionOrder, async (ext: Extension) => {
      await this.runOne(ext);
    });
  }

  /**
   * load harmony from a root extension
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static load(extensions: AnyExtension[]) {
    const graph = ExtensionGraph.from(extensions);
    return new Harmony(graph);
  }
}