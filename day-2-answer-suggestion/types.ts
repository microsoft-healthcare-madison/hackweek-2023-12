export interface QuestionnaireItem {
    linkId: string;
    text: string;
    type: string;
    required: boolean;
    repeats: boolean;
    maxLength: number;
    answerValueSet: string;
    answerOption: string[];
    item: QuestionnaireItem[];
}

export type Keywords = {
    and:(string | Keywords)[];
} | {
    or: (string | Keywords)[];
}
