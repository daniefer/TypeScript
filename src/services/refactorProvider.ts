/* @internal */
namespace ts {
    export interface Refactor {
        /** An unique code associated with each refactor */
        name: string;

        /** Description of the refactor to display in the UI of the editor */
        description: string;

        /** Compute the associated code actions */
        getEditsForAction(context: RefactorContext, actionName: string): RefactorEditInfo | undefined;

        /** Compute (quickly) which actions are available here */
        getAvailableActions(context: RefactorContext): ApplicableRefactorInfo[] | undefined;
    }

    export interface RefactorOrCodeFixContext {
        host: LanguageServiceHost;
        formatContext: ts.formatting.FormatContext;
    }

    export function getNewLineFromContext(context: RefactorOrCodeFixContext) {
        const formatSettings = context.formatContext.options;
        return (formatSettings && formatSettings.newLineCharacter) || getNewLineOrDefaultFromHost(context.host);
    }

    export function toTextChangesContext(context: RefactorOrCodeFixContext): textChanges.TextChangesContext {
        return {
            newLineCharacter: getNewLineFromContext(context),
            formatContext: context.formatContext,
        };
    }

    export interface RefactorContext extends RefactorOrCodeFixContext {
        file: SourceFile;
        startPosition: number;
        endPosition?: number;
        program: Program;
        cancellationToken?: CancellationToken;
    }

    export namespace refactor {
        // A map with the refactor code as key, the refactor itself as value
        // e.g.  nonSuggestableRefactors[refactorCode] -> the refactor you want
        const refactors: Map<Refactor> = createMap<Refactor>();

        export function registerRefactor(refactor: Refactor) {
            refactors.set(refactor.name, refactor);
        }

        export function getApplicableRefactors(context: RefactorContext): ApplicableRefactorInfo[] {
            return arrayFrom(flatMapIterator(refactors.values(), refactor =>
                context.cancellationToken && context.cancellationToken.isCancellationRequested() ? undefined : refactor.getAvailableActions(context)));
        }

        export function getEditsForRefactor(context: RefactorContext, refactorName: string, actionName: string): RefactorEditInfo | undefined {
            const refactor = refactors.get(refactorName);
            return refactor && refactor.getEditsForAction(context, actionName);
        }
    }

    export function getRefactorContextLength(context: RefactorContext): number {
        return context.endPosition === undefined ? 0 : context.endPosition - context.startPosition;
    }
}
